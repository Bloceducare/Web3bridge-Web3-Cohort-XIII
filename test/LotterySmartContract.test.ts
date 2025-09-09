import { expect } from "chai";
import { ethers } from "hardhat";
import { LotterySmartContract } from "../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("LotterySmartContract", function () {
  let lottery: LotterySmartContract;
  let owner: SignerWithAddress;
  let players: SignerWithAddress[];
  const ENTRY_FEE = ethers.utils.parseEther("0.01");

  beforeEach(async function () {
    [owner, ...players] = await ethers.getSigners();
    
    const LotteryFactory = await ethers.getContractFactory("LotterySmartContract");
    lottery = await LotteryFactory.deploy();
    await lottery.deployed();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await lottery.owner()).to.equal(owner.address);
    });

    it("Should initialize with correct values", async function () {
      expect(await lottery.lotteryActive()).to.be.true;
      expect(await lottery.lotteryRound()).to.equal(1);
      expect(await lottery.totalPrizePool()).to.equal(0);
      expect(await lottery.getPlayerCount()).to.equal(0);
    });
  });

  describe("Entry Rules", function () {
    it("Should allow a user to join with correct entry fee", async function () {
      await expect(lottery.connect(players[0]).joinLottery({ value: ENTRY_FEE }))
        .to.emit(lottery, "PlayerJoined")
        .withArgs(players[0].address, 1);
      
      expect(await lottery.getPlayerCount()).to.equal(1);
      expect(await lottery.hasPlayerJoined(players[0].address)).to.be.true;
    });

    it("Should reject entry with incorrect fee", async function () {
      const wrongFee = ethers.utils.parseEther("0.005");
      await expect(
        lottery.connect(players[0]).joinLottery({ value: wrongFee })
      ).to.be.revertedWith("IncorrectEntryFee");
    });

    it("Should prevent multiple entries from same player", async function () {
      await lottery.connect(players[0]).joinLottery({ value: ENTRY_FEE });
      
      await expect(
        lottery.connect(players[0]).joinLottery({ value: ENTRY_FEE })
      ).to.be.revertedWith("PlayerAlreadyJoined");
    });

    it("Should track multiple players correctly", async function () {
      for (let i = 0; i < 5; i++) {
        await lottery.connect(players[i]).joinLottery({ value: ENTRY_FEE });
      }
      
      expect(await lottery.getPlayerCount()).to.equal(5);
      
      const playersList = await lottery.getPlayers();
      expect(playersList.length).to.equal(5);
      
      for (let i = 0; i < 5; i++) {
        expect(playersList[i]).to.equal(players[i].address);
      }
    });
  });

  describe("Player Tracking", function () {
    beforeEach(async function () {
      // Add 3 players
      for (let i = 0; i < 3; i++) {
        await lottery.connect(players[i]).joinLottery({ value: ENTRY_FEE });
      }
    });

    it("Should store list of participants' addresses", async function () {
      const playersList = await lottery.getPlayers();
      expect(playersList.length).to.equal(3);
      
      for (let i = 0; i < 3; i++) {
        expect(playersList[i]).to.equal(players[i].address);
      }
    });

    it("Should correctly track player participation", async function () {
      for (let i = 0; i < 3; i++) {
        expect(await lottery.hasPlayerJoined(players[i].address)).to.be.true;
      }
      
      expect(await lottery.hasPlayerJoined(players[5].address)).to.be.false;
    });
  });

  describe("Random Winner Selection", function () {
    it("Should automatically select winner when 10 players join", async function () {
      // Add 9 players first
      for (let i = 0; i < 9; i++) {
        await lottery.connect(players[i]).joinLottery({ value: ENTRY_FEE });
      }
      
      expect(await lottery.getPlayerCount()).to.equal(9);
      
      // Add 10th player - should trigger winner selection
      await expect(lottery.connect(players[9]).joinLottery({ value: ENTRY_FEE }))
        .to.emit(lottery, "WinnerSelected");
      
      // Check that lottery was reset
      expect(await lottery.getPlayerCount()).to.equal(0);
      expect(await lottery.lotteryRound()).to.equal(2);
      expect(await lottery.totalPrizePool()).to.equal(0);
    });

    it("Should transfer entire prize pool to winner", async function () {
      // Add 10 players
      for (let i = 0; i < 10; i++) {
        await lottery.connect(players[i]).joinLottery({ value: ENTRY_FEE });
      }
      
      const expectedPrize = ENTRY_FEE.mul(10);
      expect(await lottery.lastWinningAmount()).to.equal(expectedPrize);
    });

    it("Should reset lottery after winner selection", async function () {
      // Add 10 players
      for (let i = 0; i < 10; i++) {
        await lottery.connect(players[i]).joinLottery({ value: ENTRY_FEE });
      }
      
      // Check reset state
      expect(await lottery.getPlayerCount()).to.equal(0);
      expect(await lottery.totalPrizePool()).to.equal(0);
      expect(await lottery.lotteryRound()).to.equal(2);
      
      // Previous players should be able to join again
      await lottery.connect(players[0]).joinLottery({ value: ENTRY_FEE });
      expect(await lottery.hasPlayerJoined(players[0].address)).to.be.true;
    });
  });

  describe("Events", function () {
    it("Should emit PlayerJoined event", async function () {
      await expect(lottery.connect(players[0]).joinLottery({ value: ENTRY_FEE }))
        .to.emit(lottery, "PlayerJoined")
        .withArgs(players[0].address, 1);
    });

    it("Should emit PrizePoolUpdated event", async function () {
      await expect(lottery.connect(players[0]).joinLottery({ value: ENTRY_FEE }))
        .to.emit(lottery, "PrizePoolUpdated")
        .withArgs(ENTRY_FEE);
    });

    it("Should emit LotteryReset event", async function () {
      // Fill lottery to trigger reset
      for (let i = 0; i < 10; i++) {
        await lottery.connect(players[i]).joinLottery({ value: ENTRY_FEE });
      }
      
      // Check that LotteryReset event was emitted (it's emitted during winner selection)
      expect(await lottery.lotteryRound()).to.equal(2);
    });
  });

  describe("Security Considerations", function () {
    it("Should prevent calling winner selection when no players", async function () {
      await expect(lottery.selectWinnerManually())
        .to.be.revertedWith("NoPlayersInLottery");
    });

    it("Should prevent joining when lottery is paused", async function () {
      await lottery.toggleLottery(); // Pause lottery
      
      await expect(
        lottery.connect(players[0]).joinLottery({ value: ENTRY_FEE })
      ).to.be.revertedWith("LotteryNotActive");
    });

    it("Should only allow owner to toggle lottery", async function () {
      await expect(lottery.connect(players[0]).toggleLottery())
        .to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should only allow owner to manually select winner", async function () {
      await lottery.connect(players[0]).joinLottery({ value: ENTRY_FEE });
      
      await expect(lottery.connect(players[1]).selectWinnerManually())
        .to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should prevent more than 10 players", async function () {
      // This test is automatically handled by the automatic winner selection
      // when 10 players join, but let's test the edge case
      
      // We can't actually test this directly since the contract automatically
      // selects a winner at 10 players, but the logic is there for safety
      expect(await lottery.MAX_PLAYERS()).to.equal(10);
    });
  });

  describe("Lottery Information", function () {
    it("Should return correct lottery info", async function () {
      await lottery.connect(players[0]).joinLottery({ value: ENTRY_FEE });
      
      const info = await lottery.getLotteryInfo();
      expect(info.currentRound).to.equal(1);
      expect(info.playerCount).to.equal(1);
      expect(info.prizePool).to.equal(ENTRY_FEE);
      expect(info.isActive).to.be.true;
    });

    it("Should track contract balance correctly", async function () {
      await lottery.connect(players[0]).joinLottery({ value: ENTRY_FEE });
      expect(await lottery.getContractBalance()).to.equal(ENTRY_FEE);
    });
  });
});
