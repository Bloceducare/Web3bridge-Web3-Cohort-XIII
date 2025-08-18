import { expect } from "chai";
import { ethers } from "hardhat";
import { Lottery } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("Lottery Contract", function () {
  let lottery: Lottery;
  let players: HardhatEthersSigner[];
  const ENTRY_FEE = ethers.parseEther("0.01");

  beforeEach(async function () {
    const signers = await ethers.getSigners();
    players = signers.slice(1);

    const LotteryFactory = await ethers.getContractFactory("Lottery");
    lottery = await LotteryFactory.deploy();
    await lottery.waitForDeployment();
  });

  describe("Entry Requirements", function () {
    it("Should allow entry with exact fee", async function () {
      await expect(
        lottery.connect(players[0]).enterLottery({ value: ENTRY_FEE })
      )
        .to.emit(lottery, "PlayerJoined")
        .withArgs(players[0].address, 0);

      expect(await lottery.getPlayerCount()).to.equal(1);
    });

    it("Should reject entry with incorrect fee", async function () {
      const wrongFee = ethers.parseEther("0.005");

      await expect(
        lottery.connect(players[0]).enterLottery({ value: wrongFee })
      ).to.be.revertedWithCustomError(lottery, "InvalidEntryFee");
    });

    it("Should reject entry with too much fee", async function () {
      const wrongFee = ethers.parseEther("0.02");

      await expect(
        lottery.connect(players[0]).enterLottery({ value: wrongFee })
      ).to.be.revertedWithCustomError(lottery, "InvalidEntryFee");
    });

    it("Should prevent duplicate entries", async function () {
      await lottery.connect(players[0]).enterLottery({ value: ENTRY_FEE });

      await expect(
        lottery.connect(players[0]).enterLottery({ value: ENTRY_FEE })
      ).to.be.revertedWithCustomError(lottery, "AlreadyEntered");
    });
  });

  describe("Player Tracking", function () {
    it("Should correctly track multiple players", async function () {
      await lottery.connect(players[0]).enterLottery({ value: ENTRY_FEE });
      await lottery.connect(players[1]).enterLottery({ value: ENTRY_FEE });
      await lottery.connect(players[2]).enterLottery({ value: ENTRY_FEE });
      await lottery.connect(players[3]).enterLottery({ value: ENTRY_FEE });
      await lottery.connect(players[4]).enterLottery({ value: ENTRY_FEE });

      expect(await lottery.getPlayerCount()).to.equal(5);

      const playersList = await lottery.getPlayers();
      expect(playersList.length).to.equal(5);
      expect(playersList[0]).to.equal(players[0].address);
      expect(playersList[1]).to.equal(players[1].address);
      expect(playersList[2]).to.equal(players[2].address);
      expect(playersList[3]).to.equal(players[3].address);
      expect(playersList[4]).to.equal(players[4].address);
    });

    it("Should track exactly 10 players", async function () {
      await lottery.connect(players[0]).enterLottery({ value: ENTRY_FEE });
      await lottery.connect(players[1]).enterLottery({ value: ENTRY_FEE });
      await lottery.connect(players[2]).enterLottery({ value: ENTRY_FEE });
      await lottery.connect(players[3]).enterLottery({ value: ENTRY_FEE });
      await lottery.connect(players[4]).enterLottery({ value: ENTRY_FEE });
      await lottery.connect(players[5]).enterLottery({ value: ENTRY_FEE });
      await lottery.connect(players[6]).enterLottery({ value: ENTRY_FEE });
      await lottery.connect(players[7]).enterLottery({ value: ENTRY_FEE });
      await lottery.connect(players[8]).enterLottery({ value: ENTRY_FEE });

      expect(await lottery.getPlayerCount()).to.equal(9);

      await lottery.connect(players[9]).enterLottery({ value: ENTRY_FEE });

      expect(await lottery.getPlayerCount()).to.equal(0);
    });
  });

  describe("Winner Selection", function () {
    it("Should select winner only after 10 players", async function () {
      await lottery.connect(players[0]).enterLottery({ value: ENTRY_FEE });
      await lottery.connect(players[1]).enterLottery({ value: ENTRY_FEE });
      await lottery.connect(players[2]).enterLottery({ value: ENTRY_FEE });
      await lottery.connect(players[3]).enterLottery({ value: ENTRY_FEE });
      await lottery.connect(players[4]).enterLottery({ value: ENTRY_FEE });
      await lottery.connect(players[5]).enterLottery({ value: ENTRY_FEE });
      await lottery.connect(players[6]).enterLottery({ value: ENTRY_FEE });
      await lottery.connect(players[7]).enterLottery({ value: ENTRY_FEE });
      await lottery.connect(players[8]).enterLottery({ value: ENTRY_FEE });

      expect(await lottery.lastWinner()).to.equal(ethers.ZeroAddress);

      await expect(
        lottery.connect(players[9]).enterLottery({ value: ENTRY_FEE })
      ).to.emit(lottery, "WinnerSelected");
    });

    it("Should transfer prize pool to winner", async function () {
      await lottery.connect(players[0]).enterLottery({ value: ENTRY_FEE });
      await lottery.connect(players[1]).enterLottery({ value: ENTRY_FEE });
      await lottery.connect(players[2]).enterLottery({ value: ENTRY_FEE });
      await lottery.connect(players[3]).enterLottery({ value: ENTRY_FEE });
      await lottery.connect(players[4]).enterLottery({ value: ENTRY_FEE });
      await lottery.connect(players[5]).enterLottery({ value: ENTRY_FEE });
      await lottery.connect(players[6]).enterLottery({ value: ENTRY_FEE });
      await lottery.connect(players[7]).enterLottery({ value: ENTRY_FEE });
      await lottery.connect(players[8]).enterLottery({ value: ENTRY_FEE });
      await lottery.connect(players[9]).enterLottery({ value: ENTRY_FEE });

      const winner = await lottery.lastWinner();
      const prizeAmount = await lottery.lastPrizeAmount();

      expect(prizeAmount).to.equal(ethers.parseEther("0.1"));
      expect(winner).to.not.equal(ethers.ZeroAddress);
    });
  });

  describe("Lottery Reset", function () {
    it("Should reset lottery after winner selection", async function () {
      await lottery.connect(players[0]).enterLottery({ value: ENTRY_FEE });
      await lottery.connect(players[1]).enterLottery({ value: ENTRY_FEE });
      await lottery.connect(players[2]).enterLottery({ value: ENTRY_FEE });
      await lottery.connect(players[3]).enterLottery({ value: ENTRY_FEE });
      await lottery.connect(players[4]).enterLottery({ value: ENTRY_FEE });
      await lottery.connect(players[5]).enterLottery({ value: ENTRY_FEE });
      await lottery.connect(players[6]).enterLottery({ value: ENTRY_FEE });
      await lottery.connect(players[7]).enterLottery({ value: ENTRY_FEE });
      await lottery.connect(players[8]).enterLottery({ value: ENTRY_FEE });
      await lottery.connect(players[9]).enterLottery({ value: ENTRY_FEE });

      expect(await lottery.getPlayerCount()).to.equal(0);
      expect(await lottery.lotteryId()).to.equal(1);
      expect(await lottery.getCurrentPrizePool()).to.equal(0);

      const playersAfterReset = await lottery.getPlayers();
      expect(playersAfterReset.length).to.equal(0);
    });

    it("Should allow players to enter new round after reset", async function () {
      await lottery.connect(players[0]).enterLottery({ value: ENTRY_FEE });
      await lottery.connect(players[1]).enterLottery({ value: ENTRY_FEE });
      await lottery.connect(players[2]).enterLottery({ value: ENTRY_FEE });
      await lottery.connect(players[3]).enterLottery({ value: ENTRY_FEE });
      await lottery.connect(players[4]).enterLottery({ value: ENTRY_FEE });
      await lottery.connect(players[5]).enterLottery({ value: ENTRY_FEE });
      await lottery.connect(players[6]).enterLottery({ value: ENTRY_FEE });
      await lottery.connect(players[7]).enterLottery({ value: ENTRY_FEE });
      await lottery.connect(players[8]).enterLottery({ value: ENTRY_FEE });
      await lottery.connect(players[9]).enterLottery({ value: ENTRY_FEE });

      await lottery.connect(players[0]).enterLottery({ value: ENTRY_FEE });
      expect(await lottery.getPlayerCount()).to.equal(1);
      expect(await lottery.lotteryId()).to.equal(1);
    });

    it("Should emit LotteryReset event", async function () {
      await lottery.connect(players[0]).enterLottery({ value: ENTRY_FEE });
      await lottery.connect(players[1]).enterLottery({ value: ENTRY_FEE });
      await lottery.connect(players[2]).enterLottery({ value: ENTRY_FEE });
      await lottery.connect(players[3]).enterLottery({ value: ENTRY_FEE });
      await lottery.connect(players[4]).enterLottery({ value: ENTRY_FEE });
      await lottery.connect(players[5]).enterLottery({ value: ENTRY_FEE });
      await lottery.connect(players[6]).enterLottery({ value: ENTRY_FEE });
      await lottery.connect(players[7]).enterLottery({ value: ENTRY_FEE });
      await lottery.connect(players[8]).enterLottery({ value: ENTRY_FEE });

      await expect(
        lottery.connect(players[9]).enterLottery({ value: ENTRY_FEE })
      )
        .to.emit(lottery, "LotteryReset")
        .withArgs(1);
    });
  });

  describe("View Functions", function () {
    it("Should return correct lottery info", async function () {
      await lottery.connect(players[0]).enterLottery({ value: ENTRY_FEE });
      await lottery.connect(players[1]).enterLottery({ value: ENTRY_FEE });
      await lottery.connect(players[2]).enterLottery({ value: ENTRY_FEE });
      await lottery.connect(players[3]).enterLottery({ value: ENTRY_FEE });
      await lottery.connect(players[4]).enterLottery({ value: ENTRY_FEE });

      const [lotteryId, playerCount, prizePool, currentPlayers] =
        await lottery.getLotteryInfo();

      expect(lotteryId).to.equal(0);
      expect(playerCount).to.equal(5);
      expect(prizePool).to.equal(ethers.parseEther("0.05"));
      expect(currentPlayers.length).to.equal(5);
    });
  });
});
