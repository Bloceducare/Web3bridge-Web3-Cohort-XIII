// SPDX-License-Identifier: MIT
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("Lottery", function () {
  async function deployLotteryFixture() {
    const [admin, ...players] = await ethers.getSigners();
    const entryFee = ethers.parseEther("0.01");

    const VRFCoordinatorV2Mock = await ethers.getContractFactory("VRFCoordinatorV2Mock");
    const vrfMock = await VRFCoordinatorV2Mock.deploy();
    await vrfMock.waitForDeployment();
    const subscriptionId = await vrfMock.createSubscription();

    const Lottery = await ethers.getContractFactory("Lottery");
    const lottery = await Lottery.deploy(
      await vrfMock.getAddress(),
      subscriptionId,
      "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c",
      entryFee
    );
    await lottery.waitForDeployment();

    return { lottery, vrfMock, admin, players, entryFee };
  }

  describe("Deployment", function () {
    it("Should deploy without errors and set correct initial state", async function () {
      const { lottery, admin, entryFee, vrfMock } = await loadFixture(deployLotteryFixture);
      expect(lottery).to.not.be.undefined;
      expect(await lottery.entryFee()).to.equal(entryFee);
      expect(await lottery.owner()).to.equal(admin.address);
      expect(await lottery.getPlayerCount()).to.equal(0);
      expect(await lottery.getPrizePool()).to.equal(0);
      expect(await lottery.uniswapV3Router()).to.equal(await vrfMock.getAddress()); // Typo in original, should be vrfCoordinator
      expect(await lottery.isRandomnessPending()).to.be.false;
    });
  });

  describe("Join", function () {
    it("Should allow users to join with exact fee and emit event", async function () {
      const { lottery, players, entryFee } = await loadFixture(deployLotteryFixture);
      await expect(lottery.connect(players[0]).join({ value: entryFee }))
        .to.emit(lottery, "PlayerJoined")
        .withArgs(players[0].address);
      expect(await lottery.getPlayerCount()).to.equal(1);
      expect((await lottery.getPlayers())[0]).to.equal(players[0].address);
      await expect(() => lottery.connect(players[0]).join({ value: entryFee }))
        .to.changeEtherBalances([players[0], lottery], [-entryFee, entryFee]);
    });

    it("Should revert if incorrect fee", async function () {
      const { lottery, players } = await loadFixture(deployLotteryFixture);
      await expect(lottery.connect(players[0]).join({ value: 0 }))
        .to.be.revertedWithCustomError(lottery, "IncorrectFee")
        .withArgs(ethers.parseEther("0.01"), 0);
    });

    it("Should revert if already entered", async function () {
      const { lottery, players, entryFee } = await loadFixture(deployLotteryFixture);
      await lottery.connect(players[0]).join({ value: entryFee });
      await expect(lottery.connect(players[0]).join({ value: entryFee }))
        .to.be.revertedWithCustomError(lottery, "AlreadyEntered");
    });

    it("Should revert if max players reached", async function () {
      const { lottery, players, entryFee } = await loadFixture(deployLotteryFixture);
      for (let i = 0; i < 10; i++) {
        await lottery.connect(players[i]).join({ value: entryFee });
      }
      await expect(lottery.connect(players[10]).join({ value: entryFee }))
        .to.be.revertedWithCustomError(lottery, "LotteryClosed");
    });

    it("Should set randomness pending at 10 players", async function () {
      const { lottery, players, entryFee } = await loadFixture(deployLotteryFixture);
      for (let i = 0; i < 9; i++) {
        await lottery.connect(players[i]).join({ value: entryFee });
      }
      expect(await lottery.isRandomnessPending()).to.be.false;
      await lottery.connect(players[9]).join({ value: entryFee });
      expect(await lottery.isRandomnessPending()).to.be.true;
    });
  });

  describe("Winner Selection", function () {
    async function fillPlayersFixture() {
      const fixture = await loadFixture(deployLotteryFixture);
      for (let i = 0; i < 10; i++) {
        await fixture.lottery.connect(fixture.players[i]).join({ value: fixture.entryFee });
      }
      return fixture;
    }

    it("Should select winner and transfer prize after fulfillment", async function () {
      const { lottery, vrfMock, players, entryFee } = await loadFixture(fillPlayersFixture);
      const initialBalance = await ethers.provider.getBalance(players[0].address);
      const requestId = 1; // Assume from request
      const randomWords = [0]; // Selects first player (index 0)
      await vrfMock.fulfillRandomWords(requestId, await lottery.getAddress(), randomWords);

      const winner = await lottery.getWinner();
      expect(winner).to.equal(players[0].address);
      expect(await lottery.getPlayerCount()).to.equal(0);
      expect(await lottery.isRandomnessPending()).to.be.false;
      await expect(() => vrfMock.fulfillRandomWords(requestId, await lottery.getAddress(), randomWords))
        .to.changeEtherBalances([players[0], lottery], [ethers.parseEther("0.1"), -ethers.parseEther("0.1")]);
      expect(await ethers.provider.getBalance(await lottery.getAddress())).to.equal(0);
    });

    it("Should emit WinnerSelected event", async function () {
      const { lottery, vrfMock } = await loadFixture(fillPlayersFixture);
      const requestId = 1;
      const randomWords = [0];
      await expect(vrfMock.fulfillRandomWords(requestId, await lottery.getAddress(), randomWords))
        .to.emit(lottery, "WinnerSelected")
        .withArgs(await lottery.getWinner(), ethers.parseEther("0.1"));
    });

    it("Should revert if not enough players for manual fulfillment", async function () {
      const { lottery, vrfMock } = await loadFixture(deployLotteryFixture);
      await expect(lottery.rawFulfillRandomWords(1, [123]))
        .to.be.revertedWithCustomError(lottery, "OnlyAdmin"); // Only VRF can call
    });

    it("Should revert if randomness already pending", async function () {
      const { lottery, players, entryFee } = await loadFixture(deployLotteryFixture);
      for (let i = 0; i < 10; i++) {
        await lottery.connect(players[i]).join({ value: entryFee });
      }
      await expect(lottery.connect(players[0]).join({ value: entryFee }))
        .to.be.revertedWithCustomError(lottery, "RandomnessPending");
    });
  });

  describe("Reset", function () {
    it("Should reset lottery for next round", async function () {
      const { lottery, vrfMock, players, entryFee } = await loadFixture(fillPlayersFixture);
      const requestId = 1;
      const randomWords = [0];
      await vrfMock.fulfillRandomWords(requestId, await lottery.getAddress(), randomWords);

      // Join again
      await lottery.connect(players[0]).join({ value: entryFee });
      expect(await lottery.getPlayerCount()).to.equal(1);
      expect(await lottery.getWinner()).to.equal(ethers.ZeroAddress);
    });
  });
});