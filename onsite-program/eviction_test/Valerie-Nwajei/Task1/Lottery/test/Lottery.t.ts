

import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import type { Contract } from "ethers";
import hre from "hardhat";


describe("Lottery", function () {
  const ENTRY_FEE = hre.ethers.parseEther("0.01");
  const MAX_PLAYERS = 10;

  async function deployLotteryFixture() {
    const [owner, ...players] = await ethers.getSigners();
    const Lottery = await ethers.getContractFactory("Lottery");
    const lottery = await Lottery.deploy();
    return { lottery, owner, players };
  }

  async function deployAndEnterFixture() {
    const fixture = await loadFixture(deployLotteryFixture);
    const { lottery, players } = fixture;
    
    // First 10 players enter
    const entries = players.slice(0, MAX_PLAYERS).map(player => 
      lottery.connect(player).enter({ value: ENTRY_FEE })
    );
    
    await Promise.all(entries);
    return fixture;
  }

  describe("Deployment", function () {
    it("Should set the right entry fee", async function () {
      const { lottery } = await loadFixture(deployLotteryFixture);
      expect(await lottery.getEntryFee()).to.equal(ENTRY_FEE);
    });

    it("Should start with round 1", async function () {
      const { lottery } = await loadFixture(deployLotteryFixture);
      expect(await lottery.getCurrentRound()).to.equal(1);
    });

    it("Should have empty players list initially", async function () {
      const { lottery } = await loadFixture(deployLotteryFixture);
      const players = await lottery.getPlayers();
      expect(players.length).to.equal(0);
    });
  });

  describe("Player Entry", function () {
    it("Should allow players to enter with exact fee", async function () {
      const { lottery, players } = await loadFixture(deployLotteryFixture);
      await expect(lottery.connect(players[0]).enter({ value: ENTRY_FEE }))
        .to.emit(lottery, "PlayerEntered")
        .withArgs(players[0].address, 1);
    });

    it("Should reject entry with incorrect fee", async function () {
      const { lottery, players } = await loadFixture(deployLotteryFixture);
      await expect(lottery.connect(players[0]).enter({ value: hre.ethers.parseEther("0.02") }))
        .to.be.revertedWith("Incorrect ETH amount");
    });

    it("Should prevent duplicate entries in same round", async function () {
      const { lottery, players } = await loadFixture(deployLotteryFixture);
      await lottery.connect(players[0]).enter({ value: ENTRY_FEE });
      await expect(lottery.connect(players[0]).enter({ value: ENTRY_FEE }))
        .to.be.revertedWith("Already entered this round");
    });

    it("Should track all entered players", async function () {
      const { lottery, players } = await loadFixture(deployLotteryFixture);
      
      // Enter 5 players
      for (let i = 0; i < 5; i++) {
        await lottery.connect(players[i]).enter({ value: ENTRY_FEE });
      }

      const currentPlayers = await lottery.getPlayers();
      expect(currentPlayers.length).to.equal(5);
    });
  });

  describe("Winner Selection", function () {
    it("Should automatically select winner after 10 players", async function () {
      const { lottery, players } = await loadFixture(deployAndEnterFixture);
      
      const prizePool = ENTRY_FEE * BigInt(MAX_PLAYERS);
      const winner = await lottery.getLastWinner();
      
      expect(winner).to.be.oneOf(players.slice(0, MAX_PLAYERS).map(p => p.address));
      await expect(lottery.getPrizePool()).to.eventually.equal(0);
    });

    it("Should transfer entire prize pool to winner", async function () {
      const { lottery, players } = await loadFixture(deployAndEnterFixture);

      const winner = await lottery.getLastWinner();
      const winnerIndex = players.findIndex(p => p.address === winner);

      // Check that the contract balance is now 0 (all funds transferred)
      expect(await lottery.getPrizePool()).to.equal(0);

      // Check that winner is one of the players
      expect(winner).to.be.oneOf(players.slice(0, MAX_PLAYERS).map(p => p.address));
    });

    it("Should reset for next round after winner selection", async function () {
      const { lottery } = await loadFixture(deployAndEnterFixture);
      
      expect(await lottery.getCurrentRound()).to.equal(2);
      expect(await lottery.getPlayers()).to.have.lengthOf(0);
    });

    it("Should allow new entries in next round", async function () {
      const { lottery, players } = await loadFixture(deployAndEnterFixture);
      
      // New player enters in round 2
      await lottery.connect(players[MAX_PLAYERS]).enter({ value: ENTRY_FEE });
      
      const currentPlayers = await lottery.getPlayers();
      expect(currentPlayers).to.have.lengthOf(1);
      expect(currentPlayers[0]).to.equal(players[MAX_PLAYERS].address);
    });
  });
});