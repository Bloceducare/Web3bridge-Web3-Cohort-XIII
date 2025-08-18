import { expect } from "chai";
import { ethers } from "hardhat";
import { MaryjaneBoardGameToken, MaryjaneBoardGameArena } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("MaryjaneBoardGameArena", function () {
  let gameToken: MaryjaneBoardGameToken;
  let gameArena: MaryjaneBoardGameArena;
  let owner: SignerWithAddress;
  let participant1: SignerWithAddress;
  let participant2: SignerWithAddress;
  let participant3: SignerWithAddress;
  let participant4: SignerWithAddress;
  let participant5: SignerWithAddress;

  const DEPOSIT_AMOUNT = ethers.parseEther("100");
  const INITIAL_BALANCE = ethers.parseEther("1000");

  beforeEach(async function () {
    [owner, participant1, participant2, participant3, participant4, participant5] = await ethers.getSigners();

    const TokenFactory = await ethers.getContractFactory("MaryjaneBoardGameToken");
    gameToken = await TokenFactory.deploy();
    await gameToken.waitForDeployment();

    const ArenaFactory = await ethers.getContractFactory("MaryjaneBoardGameArena");
    gameArena = await ArenaFactory.deploy(await gameToken.getAddress());
    await gameArena.waitForDeployment();

    await gameToken.approveGameContract(await gameArena.getAddress());

    await gameToken.createTokens(participant1.address, INITIAL_BALANCE);
    await gameToken.createTokens(participant2.address, INITIAL_BALANCE);
    await gameToken.createTokens(participant3.address, INITIAL_BALANCE);
    await gameToken.createTokens(participant4.address, INITIAL_BALANCE);
    await gameToken.createTokens(participant5.address, INITIAL_BALANCE);

    await gameToken.connect(participant1).approve(await gameArena.getAddress(), INITIAL_BALANCE);
    await gameToken.connect(participant2).approve(await gameArena.getAddress(), INITIAL_BALANCE);
    await gameToken.connect(participant3).approve(await gameArena.getAddress(), INITIAL_BALANCE);
    await gameToken.connect(participant4).approve(await gameArena.getAddress(), INITIAL_BALANCE);
    await gameToken.connect(participant5).approve(await gameArena.getAddress(), INITIAL_BALANCE);
  });

  describe("Token Contract", function () {
    it("Should deploy with correct initial supply", async function () {
      const totalSupply = await gameToken.totalSupply();
      expect(totalSupply).to.equal(ethers.parseEther("1000000"));
    });

    it("Should mint tokens to participants", async function () {
      const balance = await gameToken.balanceOf(participant1.address);
      expect(balance).to.equal(INITIAL_BALANCE);
    });

    it("Should check if participant has enough tokens for deposit", async function () {
      const hasEnough = await gameToken.checkStakeEligibility(participant1.address);
      expect(hasEnough).to.be.true;
    });

    it("Should return correct deposit amount", async function () {
      const depositAmount = await gameToken.getRequiredStakeAmount();
      expect(depositAmount).to.equal(DEPOSIT_AMOUNT);
    });
  });

  describe("Match Creation", function () {
    it("Should create a new match", async function () {
      const tx = await gameArena.connect(participant1).initializeMatch("Participant1");
      await expect(tx)
        .to.emit(gameArena, "MatchCreated")
        .withArgs(0, participant1.address);

      await expect(tx)
        .to.emit(gameArena, "ParticipantJoined")
        .withArgs(0, participant1.address, "Participant1", 0);
    });

    it("Should not allow empty participant name", async function () {
      await expect(gameArena.connect(participant1).initializeMatch(""))
        .to.be.revertedWith("Participant name cannot be empty");
    });

    it("Should not allow participant to create multiple matches", async function () {
      await gameArena.connect(participant1).initializeMatch("Participant1");
      await expect(gameArena.connect(participant1).initializeMatch("Participant1Again"))
        .to.be.revertedWith("Participant already in a match");
    });

    it("Should assign CRIMSON color to first participant", async function () {
      await gameArena.connect(participant1).initializeMatch("Participant1");
      const participantData = await gameArena.getParticipantDetails(0, 0);
      expect(participantData.color).to.equal(0);
    });
  });

  describe("Joining Matches", function () {
    beforeEach(async function () {
      await gameArena.connect(participant1).initializeMatch("Participant1");
    });

    it("Should allow participants to join match", async function () {
      const tx = await gameArena.connect(participant2).enterMatch(0, "Participant2");
      await expect(tx)
        .to.emit(gameArena, "ParticipantJoined")
        .withArgs(0, participant2.address, "Participant2", 1);
    });

    it("Should assign different colors to different participants", async function () {
      await gameArena.connect(participant2).enterMatch(0, "Participant2");
      await gameArena.connect(participant3).enterMatch(0, "Participant3");
      await gameArena.connect(participant4).enterMatch(0, "Participant4");

      const participant1Data = await gameArena.getParticipantDetails(0, 0);
      const participant2Data = await gameArena.getParticipantDetails(0, 1);
      const participant3Data = await gameArena.getParticipantDetails(0, 2);
      const participant4Data = await gameArena.getParticipantDetails(0, 3);

      expect(participant1Data.color).to.equal(0);
      expect(participant2Data.color).to.equal(1);
      expect(participant3Data.color).to.equal(2);
      expect(participant4Data.color).to.equal(3);
    });

    it("Should not allow more than 4 participants", async function () {
      await gameArena.connect(participant2).enterMatch(0, "Participant2");
      await gameArena.connect(participant3).enterMatch(0, "Participant3");
      await gameArena.connect(participant4).enterMatch(0, "Participant4");

      await expect(gameArena.connect(participant5).enterMatch(0, "Participant5"))
        .to.be.revertedWith("Match is full");
    });

    it("Should not allow joining non-existent match", async function () {
      await expect(gameArena.connect(participant2).enterMatch(999, "Participant2"))
        .to.be.revertedWith("Match does not exist");
    });
  });

  describe("Token Deposits", function () {
    beforeEach(async function () {
      await gameArena.connect(participant1).initializeMatch("Participant1");
      await gameArena.connect(participant2).enterMatch(0, "Participant2");
    });

    it("Should allow participants to make deposits", async function () {
      const tx = await gameArena.connect(participant1).makeDeposit(0);
      await expect(tx)
        .to.emit(gameArena, "DepositMade")
        .withArgs(0, participant1.address, DEPOSIT_AMOUNT);
    });

    it("Should not allow double deposits", async function () {
      await gameArena.connect(participant1).makeDeposit(0);
      await expect(gameArena.connect(participant1).makeDeposit(0))
        .to.be.revertedWith("Already deposited");
    });

    it("Should start match when all participants deposit", async function () {
      await gameArena.connect(participant1).makeDeposit(0);
      const tx = await gameArena.connect(participant2).makeDeposit(0);

      await expect(tx).to.emit(gameArena, "MatchStarted").withArgs(0);

      const matchData = await gameArena.getMatchDetails(0);
      expect(matchData.status).to.equal(1);
    });

    it("Should transfer tokens to contract", async function () {
      const initialBalance = await gameToken.balanceOf(participant1.address);
      await gameArena.connect(participant1).makeDeposit(0);
      const finalBalance = await gameToken.balanceOf(participant1.address);

      expect(initialBalance - finalBalance).to.equal(DEPOSIT_AMOUNT);
    });
  });

  describe("Dice Throwing and Match Play", function () {
    beforeEach(async function () {
      await gameArena.connect(participant1).initializeMatch("Participant1");
      await gameArena.connect(participant2).enterMatch(0, "Participant2");
      await gameArena.connect(participant1).makeDeposit(0);
      await gameArena.connect(participant2).makeDeposit(0);
    });

    it("Should allow active participant to throw dice", async function () {
      const tx = await gameArena.connect(participant1).throwDice(0);
      await expect(tx).to.emit(gameArena, "DiceThrown");
    });

    it("Should not allow non-active participant to throw dice", async function () {
      await expect(gameArena.connect(participant2).throwDice(0))
        .to.be.revertedWith("Not your turn");
    });

    it("Should return dice result between 1 and 6", async function () {
      const tx = await gameArena.connect(participant1).throwDice(0);
      const receipt = await tx.wait();

      const matchData = await gameArena.getMatchDetails(0);
      expect(matchData.recentDiceValue).to.be.at.least(1);
      expect(matchData.recentDiceValue).to.be.at.most(6);
    });

    it("Should allow moving token with valid dice result", async function () {
      await gameArena.connect(participant1).throwDice(0);
      const matchData = await gameArena.getMatchDetails(0);

      if (matchData.recentDiceValue === 6n) {
        const tx = await gameArena.connect(participant1).moveToken(0, 0, Number(matchData.recentDiceValue));
        await expect(tx).to.emit(gameArena, "TokenMoved");
      }
    });

    it("Should require 6 to move token out of base", async function () {
      await expect(gameArena.connect(participant1).moveToken(0, 0, 3))
        .to.be.revertedWith("Need 6 to move out of base");
    });

    it("Should not allow invalid token index", async function () {
      await expect(gameArena.connect(participant1).moveToken(0, 5, 6))
        .to.be.revertedWith("Invalid token index");
    });

    it("Should not allow invalid dice result", async function () {
      await expect(gameArena.connect(participant1).moveToken(0, 0, 7))
        .to.be.revertedWith("Invalid dice result");
    });
  });

  describe("Match State Management", function () {
    beforeEach(async function () {
      await gameArena.connect(participant1).initializeMatch("Participant1");
      await gameArena.connect(participant2).enterMatch(0, "Participant2");
    });

    it("Should return correct match information", async function () {
      const matchData = await gameArena.getMatchDetails(0);
      expect(matchData.id).to.equal(0);
      expect(matchData.participantCount).to.equal(2);
      expect(matchData.status).to.equal(0);
    });

    it("Should return correct participant information", async function () {
      const participantData = await gameArena.getParticipantDetails(0, 0);
      expect(participantData.walletAddress).to.equal(participant1.address);
      expect(participantData.name).to.equal("Participant1");
      expect(participantData.color).to.equal(0);
      expect(participantData.hasDeposited).to.be.false;
    });

    it("Should return active participant correctly", async function () {
      await gameArena.connect(participant1).makeDeposit(0);
      await gameArena.connect(participant2).makeDeposit(0);

      const activeParticipant = await gameArena.getActiveParticipant(0);
      expect(activeParticipant).to.equal(participant1.address);
    });

    it("Should track participant's current match", async function () {
      const matchId = await gameArena.getParticipantMatch(participant1.address);
      expect(matchId).to.equal(0);
    });
  });

  describe("Exiting Matches", function () {
    beforeEach(async function () {
      await gameArena.connect(participant1).initializeMatch("Participant1");
      await gameArena.connect(participant2).enterMatch(0, "Participant2");
    });

    it("Should allow participant to exit match before depositing", async function () {
      await gameArena.connect(participant2).exitMatch(0);

      const matchData = await gameArena.getMatchDetails(0);
      expect(matchData.participantCount).to.equal(1);

      const participantMatch = await gameArena.getParticipantMatch(participant2.address);
      expect(participantMatch).to.equal(0);
    });

    it("Should return deposit when exiting after depositing", async function () {
      await gameArena.connect(participant1).makeDeposit(0);

      const initialBalance = await gameToken.balanceOf(participant1.address);
      await gameArena.connect(participant1).exitMatch(0);
      const finalBalance = await gameToken.balanceOf(participant1.address);

      expect(finalBalance - initialBalance).to.equal(DEPOSIT_AMOUNT);
    });

    it("Should not allow exiting active match", async function () {
      await gameArena.connect(participant1).makeDeposit(0);
      await gameArena.connect(participant2).makeDeposit(0);

      await expect(gameArena.connect(participant1).exitMatch(0))
        .to.be.revertedWith("Cannot exit active match");
    });
  });

  describe("Edge Cases", function () {
    it("Should handle insufficient token balance", async function () {
      const poorParticipant = participant5;
      await gameToken.connect(poorParticipant).transfer(owner.address, INITIAL_BALANCE);

      await expect(gameArena.connect(poorParticipant).initializeMatch("PoorParticipant"))
        .to.be.revertedWith("Insufficient tokens for deposit");
    });

    it("Should handle match counter correctly", async function () {
      await gameArena.connect(participant1).initializeMatch("Participant1");
      await gameArena.connect(participant2).initializeMatch("Participant2");

      const matchCount = await gameArena.getMatchCount();
      expect(matchCount).to.equal(2);
    });

    it("Should not allow operations on non-existent matches", async function () {
      await expect(gameArena.getMatchDetails(999))
        .to.be.revertedWith("Match does not exist");
    });
  });
});
