import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { Lottery } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("Lottery", function () {
  async function deployLotteryFixture() {
    const [owner, ...players]: SignerWithAddress[] = await ethers.getSigners();

    const Lottery = await ethers.getContractFactory("Lottery");
    const lottery: Lottery = await Lottery.deploy();

    const entryFee = await lottery.Base_fee();
    const maxPlayers = await lottery.MAX();

    return { lottery, owner, players, entryFee, maxPlayers };
  }

  describe("Deployment", function () {
    it("set the correct initial values", async function () {
      const { lottery } = await loadFixture(deployLotteryFixture);

      expect(await lottery.Base_fee()).to.equal(ethers.parseEther("0.01"));
      expect(await lottery.MAX()).to.equal(10);
      expect(await lottery.getLotteryId()).to.equal(1);
      expect(await lottery.getPlayerCount()).to.equal(0);
      expect(await lottery.getPrizePool()).to.equal(0);
    });
  });

  describe("Joining the Lottery", function () {
    it("allow a player to join with exact entry fee", async function () {
      const { lottery, players, entryFee } =
        await loadFixture(deployLotteryFixture);

      await expect(lottery.connect(players[0]).joinLottery({ value: entryFee }))
        .to.emit(lottery, "PlayerJoined")
        .withArgs(players[0].address, 1, 1);

      expect(await lottery.getPlayerCount()).to.equal(1);
      expect(await lottery.getPrizePool()).to.equal(entryFee);
      expect(await lottery.hasPlayerJoined(players[0].address)).to.be.true;
    });

    it("reject incorrect entry fee", async function () {
      const { lottery, players, entryFee } =
        await loadFixture(deployLotteryFixture);

      await expect(
        lottery.connect(players[0]).joinLottery({ value: entryFee - 1n }),
      ).to.be.revertedWithCustomError(lottery, "IncorrectEntryFee");

      await expect(
        lottery.connect(players[0]).joinLottery({ value: entryFee + 1n }),
      ).to.be.revertedWithCustomError(lottery, "IncorrectEntryFee");
    });

    it("prevent duplicate entries", async function () {
      const { lottery, players, entryFee } =
        await loadFixture(deployLotteryFixture);

      // First entry succeed
      await lottery.connect(players[0]).joinLottery({ value: entryFee });

      // Second entry fail
      await expect(
        lottery.connect(players[0]).joinLottery({ value: entryFee }),
      ).to.be.revertedWithCustomError(lottery, "AlreadyJoined");
    });

    it("track multiple players correctly", async function () {
      const { lottery, players, entryFee } =
        await loadFixture(deployLotteryFixture);

      for (let i = 0; i < 5; i++) {
        await lottery.connect(players[i]).joinLottery({ value: entryFee });
      }

      expect(await lottery.getPlayerCount()).to.equal(5);
      expect(await lottery.getPrizePool()).to.equal(entryFee * 5n);

      const allPlayers = await lottery.getPlayers();
      expect(allPlayers.length).to.equal(5);

      for (let i = 0; i < 5; i++) {
        expect(allPlayers[i]).to.equal(players[i].address);
        expect(await lottery.hasPlayerJoined(players[i].address)).to.be.true;
      }
    });
  });

  describe("Winner Selection", function () {
    it("automatically select winner after 10 players join", async function () {
      const { lottery, players, entryFee } =
        await loadFixture(deployLotteryFixture);

      // Add 9 players first
      for (let i = 0; i < 9; i++) {
        await lottery.connect(players[i]).joinLottery({ value: entryFee });
      }

      expect(await lottery.getPlayerCount()).to.equal(9);
      expect(await lottery.getLastWinner()).to.equal(ethers.ZeroAddress);

      const tx = await lottery
        .connect(players[9])
        .joinLottery({ value: entryFee });

      await expect(tx).to.emit(lottery, "WinnerSelected");
      await expect(tx).to.emit(lottery, "LotteryReset");

      expect(await lottery.getPlayerCount()).to.equal(0);
      expect(await lottery.getPrizePool()).to.equal(0);
      expect(await lottery.getLotteryId()).to.equal(2);
      expect(await lottery.getLastWinner()).to.not.equal(ethers.ZeroAddress);
    });

    it("transfer correct prize amount to winner", async function () {
      const { lottery, players, entryFee } =
        await loadFixture(deployLotteryFixture);

      const expectedPrize = entryFee * 10n;
      const playerBalances: bigint[] = [];

      for (let i = 0; i < 10; i++) {
        playerBalances[i] = await ethers.provider.getBalance(
          players[i].address,
        );
      }

      const txs = [];
      for (let i = 0; i < 10; i++) {
        txs[i] = await lottery
          .connect(players[i])
          .joinLottery({ value: entryFee });
      }

      const winner = await lottery.getLastWinner();
      const winnerIndex = players.findIndex((p) => p.address === winner);

      expect(winnerIndex).to.be.greaterThan(-1);

      const winnerTx = txs[winnerIndex];
      const receipt = await winnerTx.wait();
      const gasCost = receipt!.gasUsed * receipt!.gasPrice;

      const finalBalance = await ethers.provider.getBalance(
        players[winnerIndex].address,
      );
      const expectedBalance =
        playerBalances[winnerIndex] - entryFee - gasCost + expectedPrize;

      expect(finalBalance).to.equal(expectedBalance);
    });

    it("prevent lottery from accepting more than 10 players", async function () {
      const { lottery, players, entryFee } =
        await loadFixture(deployLotteryFixture);

      for (let i = 0; i < 10; i++) {
        await lottery.connect(players[i]).joinLottery({ value: entryFee });
      }

     await expect(
        lottery.connect(players[10]).joinLottery({ value: entryFee }),
      )
        .to.emit(lottery, "PlayerJoined")
        .withArgs(players[10].address, 2, 1);
    });
  });

  describe(" Resetting Lottery  ", function () {
    it("reset lottery state after winner selection", async function () {
      const { lottery, players, entryFee } =
        await loadFixture(deployLotteryFixture);

      for (let i = 0; i < 10; i++) {
        await lottery.connect(players[i]).joinLottery({ value: entryFee });
      }

      expect(await lottery.getPlayerCount()).to.equal(0);
      expect(await lottery.getPrizePool()).to.equal(0);
      expect(await lottery.getLotteryId()).to.equal(2);
      expect(await lottery.getSpotsRemaining()).to.equal(10);

      for (let i = 0; i < 10; i++) {
        expect(await lottery.hasPlayerJoined(players[i].address)).to.be.false;
      }

      const currentPlayers = await lottery.getPlayers();
      expect(currentPlayers.length).to.equal(0);
    });

    it("allow previous players to join new lottery round", async function () {
      const { lottery, players, entryFee } =
        await loadFixture(deployLotteryFixture);

      for (let i = 0; i < 10; i++) {
        await lottery.connect(players[i]).joinLottery({ value: entryFee });
      }

      await expect(lottery.connect(players[0]).joinLottery({ value: entryFee }))
        .to.emit(lottery, "PlayerJoined")
        .withArgs(players[0].address, 2, 1);

      expect(await lottery.hasPlayerJoined(players[0].address)).to.be.true;
      expect(await lottery.getLotteryId()).to.equal(2);
    });
  });

  describe("View Functions", function () {
    it("return correct player information", async function () {
      const { lottery, players, entryFee } =
        await loadFixture(deployLotteryFixture);

      for (let i = 0; i < 3; i++) {
        await lottery.connect(players[i]).joinLottery({ value: entryFee });
      }

      const allPlayers = await lottery.getPlayers();
      expect(allPlayers.length).to.equal(3);
      expect(allPlayers[0]).to.equal(players[0].address);
      expect(allPlayers[1]).to.equal(players[1].address);
      expect(allPlayers[2]).to.equal(players[2].address);
    });

    it("return spots remaining", async function () {
      const { lottery, players, entryFee } =
        await loadFixture(deployLotteryFixture);

      expect(await lottery.getSpotsRemaining()).to.equal(10);

      await lottery.connect(players[0]).joinLottery({ value: entryFee });
      expect(await lottery.getSpotsRemaining()).to.equal(9);

      await lottery.connect(players[1]).joinLottery({ value: entryFee });
      expect(await lottery.getSpotsRemaining()).to.equal(8);
    });

    it("return correct contract balance", async function () {
      const { lottery, players, entryFee } =
        await loadFixture(deployLotteryFixture);

      expect(await lottery.getContractBalance()).to.equal(0);

      await lottery.connect(players[0]).joinLottery({ value: entryFee });
      expect(await lottery.getContractBalance()).to.equal(entryFee);

     for (let i = 1; i < 10; i++) {
        await lottery.connect(players[i]).joinLottery({ value: entryFee });
      }
      expect(await lottery.getContractBalance()).to.equal(0);
    });
  });

  describe("Events", function () {
    it("emit PlayerJoined event with correct parameters", async function () {
      const { lottery, players, entryFee } =
        await loadFixture(deployLotteryFixture);

      await expect(lottery.connect(players[0]).joinLottery({ value: entryFee }))
        .to.emit(lottery, "PlayerJoined")
        .withArgs(players[0].address, 1, 1);

      await expect(lottery.connect(players[1]).joinLottery({ value: entryFee }))
        .to.emit(lottery, "PlayerJoined")
        .withArgs(players[1].address, 1, 2);
    });

    it("emit WinnerSelected and LotteryReset events", async function () {
      const { lottery, players, entryFee } =
        await loadFixture(deployLotteryFixture);

      for (let i = 0; i < 9; i++) {
        await lottery.connect(players[i]).joinLottery({ value: entryFee });
      }

     const tx = lottery.connect(players[9]).joinLottery({ value: entryFee });

      await expect(tx)
        .to.emit(lottery, "WinnerSelected")
        .to.emit(lottery, "LotteryReset")
        .withArgs(2);
    });
  });

});