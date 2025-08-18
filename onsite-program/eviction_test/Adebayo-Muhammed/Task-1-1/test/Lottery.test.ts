import { expect } from "chai";
import { ethers } from "hardhat";
import { Lottery } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("Lottery Contract Tests", function () {
  let lottery: Lottery;
  let players: HardhatEthersSigner[];

  async function deployLottery() {
    const signers = await ethers.getSigners();
    players = signers.slice(1, 15);
    
    const LotteryFactory = await ethers.getContractFactory("Lottery");
    lottery = await LotteryFactory.deploy();
    
    return lottery;
  }

  describe("1. Users can enter only with exact fee", function () {
    it("Should allow entry with exact 0.01 ETH", async function () {
      await deployLottery();
      const ENTRY_FEE = ethers.parseEther("0.01");

      await lottery.connect(players[0]).enterLottery({ value: ENTRY_FEE });

      expect(await lottery.getPlayerCount()).to.equal(1);
    });

    it("Should reject entry with insufficient fee", async function () {
      await deployLottery();

      await expect(
        lottery.connect(players[0]).enterLottery({ value: ethers.parseEther("0.005") })
      ).to.be.revertedWith("Must pay exactly 0.01 ETH");
    });

    it("Should reject entry with excessive fee", async function () {
      await deployLottery();

      await expect(
        lottery.connect(players[0]).enterLottery({ value: ethers.parseEther("0.02") })
      ).to.be.revertedWith("Must pay exactly 0.01 ETH");
    });
  });

  describe("2. Contract correctly tracks 10 players", function () {
    it("Should track player count correctly up to 9 players", async function () {
      await deployLottery();
      const ENTRY_FEE = ethers.parseEther("0.01");

      for (let i = 0; i < 9; i++) {
        await lottery.connect(players[i]).enterLottery({ value: ENTRY_FEE });
        expect(await lottery.getPlayerCount()).to.equal(i + 1);
      }
    });
  });

  describe("3. Only after 10 players, winner is chosen", function () {
    it("Should automatically select winner when 10th player joins", async function () {
      await deployLottery();
      const ENTRY_FEE = ethers.parseEther("0.01");

      for (let i = 0; i < 9; i++) {
        await lottery.connect(players[i]).enterLottery({ value: ENTRY_FEE });
      }

      const tx = await lottery.connect(players[9]).enterLottery({ value: ENTRY_FEE });

      await expect(tx).to.emit(lottery, "WinnerSelected");
    });
  });

  describe("4. Prize pool transferred correctly to winner", function () {
    it("Should reset prize pool after winner selection", async function () {
      await deployLottery();
      const ENTRY_FEE = ethers.parseEther("0.01");

      for (let i = 0; i < 10; i++) {
        await lottery.connect(players[i]).enterLottery({ value: ENTRY_FEE });
      }

      expect(await lottery.getPrizePool()).to.equal(0);
    });
  });

  describe("5. Lottery resets for next round", function () {
    it("Should reset and allow new round", async function () {
      await deployLottery();
      const ENTRY_FEE = ethers.parseEther("0.01");

      expect(await lottery.getCurrentRound()).to.equal(1);

      for (let i = 0; i < 10; i++) {
        await lottery.connect(players[i]).enterLottery({ value: ENTRY_FEE });
      }

      expect(await lottery.getPlayerCount()).to.equal(0);
      expect(await lottery.getCurrentRound()).to.equal(2);

      await lottery.connect(players[0]).enterLottery({ value: ENTRY_FEE });
      expect(await lottery.getPlayerCount()).to.equal(1);
    });
  });
});
