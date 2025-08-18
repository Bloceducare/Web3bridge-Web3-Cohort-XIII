import { expect } from "chai";
import { network } from "hardhat";
import {  } from "@nomicfoundation/hardhat-ethers";

const { ethers } = await network.connect();

describe("Lottery", function () {
  let lottery: any;
  let owner: any;
  let players: any[];
  const ENTRY_FEE = ethers.parseEther("0.01");

  beforeEach(async function () {
    [owner, ...players] = await ethers.getSigners();
    
    const LotteryFactory = await ethers.getContractFactory("Lottery");
    lottery = await LotteryFactory.deploy();
    await lottery.waitForDeployment();
  });

  describe("Entry Requirements", function () {
    it("Should allow entry with exact fee", async function () {
      await expect(lottery.connect(players[0]).enterLottery({ value: ENTRY_FEE }))
        .to.emit(lottery, "PlayerJoined")
        .withArgs(players[0].address, 0);
      
      expect(await lottery.getPlayersCount()).to.equal(1);
      expect(await lottery.players(0)).to.equal(players[0].address);
    });

    it("Should reject entry with incorrect fee", async function () {
      const wrongFee = ethers.parseEther("0.005");
      await expect(lottery.connect(players[0]).enterLottery({ value: wrongFee }))
        .to.be.revertedWith("Incorrect entry fee");
    });
  });

  describe("Player Tracking", function () {
    it("Should correctly track multiple players", async function () {
      for (let i = 0; i < 5; i++) {
        await lottery.connect(players[i]).enterLottery({ value: ENTRY_FEE });
        expect(await lottery.getPlayersCount()).to.equal(i + 1);
        expect(await lottery.players(i)).to.equal(players[i].address);
      }
    });

    it("Should track hasEntered mapping correctly", async function () {
      await lottery.connect(players[0]).enterLottery({ value: ENTRY_FEE });
      
      expect(await lottery.hasEntered(players[0].address)).to.be.true;
      expect(await lottery.hasEntered(players[1].address)).to.be.false;
    });

  });

  describe("Winner Selection", function () {  
    it("Should transfer entire prize pool to winner", async function () {
      const testPlayers = players.slice(0, 10);

      for (let i = 0; i < 9; i++) {
        await lottery.connect(testPlayers[i]).enterLottery({ value: ENTRY_FEE });
      }     

      const tx = await lottery.connect(testPlayers[9]).enterLottery({ value: ENTRY_FEE });
      const receipt = await tx.wait();

      expect(await lottery.getPrizePool()).to.equal(0);
    });
  });

  describe("Lottery Reset", function () {
    it("Should reset lottery after winner selection", async function () {
      const testPlayers = players.slice(0, 10);
      
      for (const player of testPlayers) {
        await lottery.connect(player).enterLottery({ value: ENTRY_FEE });
      }
      
      expect(await lottery.getPlayersCount()).to.equal(0);
      expect(await lottery.currentRound()).to.equal(1);
      
      for (const player of testPlayers) {
        expect(await lottery.hasEntered(player.address)).to.be.false;
      }
    });

    it("Should allow same players to enter new round", async function () {
      const testPlayers = players.slice(0, 10);
      
      for (const player of testPlayers) {
        await lottery.connect(player).enterLottery({ value: ENTRY_FEE });
      }
      
      await lottery.connect(testPlayers[0]).enterLottery({ value: ENTRY_FEE });
      expect(await lottery.getPlayersCount()).to.equal(1);
      expect(await lottery.players(0)).to.equal(testPlayers[0].address);
    });

    it("Should emit LotteryReset event", async function () {
      const testPlayers = players.slice(0, 10);
      
      for (let i = 0; i < 9; i++) {
        await lottery.connect(testPlayers[i]).enterLottery({ value: ENTRY_FEE });
      }
      
      await expect(lottery.connect(testPlayers[9]).enterLottery({ value: ENTRY_FEE }))
        .to.emit(lottery, "LotteryReset")
        .withArgs(1);
    });
  });

  describe("View Functions", function () {
    it("Should return correct prize pool", async function () {
      expect(await lottery.getPrizePool()).to.equal(0);
      
      await lottery.connect(players[0]).enterLottery({ value: ENTRY_FEE });
      expect(await lottery.getPrizePool()).to.equal(ENTRY_FEE);
      
      await lottery.connect(players[1]).enterLottery({ value: ENTRY_FEE });
      expect(await lottery.getPrizePool()).to.equal(ENTRY_FEE * BigInt(2));
    });

    it("Should return correct constants", async function () {
      expect(await lottery.ENTRY_FEE()).to.equal(ENTRY_FEE);
      expect(await lottery.MAX_PLAYERS()).to.equal(10);
    });
  });

});
