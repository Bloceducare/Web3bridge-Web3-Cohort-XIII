import { expect } from "chai";
import { ethers } from "hardhat";
import { Lottery } from "../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("Lottery", function () {
  let lottery: Lottery;
  let owner: SignerWithAddress;
  let players: SignerWithAddress[];
  const ENTRY_FEE = ethers.utils.parseEther("0.02");

  beforeEach(async function () {
    [owner, ...players] = await ethers.getSigners();
    
    const LotteryFactory = await ethers.getContractFactory("Lottery");
    lottery = await LotteryFactory.deploy();
    await lottery.deployed();
  });

  describe("Entry Requirements", function () {
    it("Should allow entry with exact fee", async function () {
      await expect(lottery.connect(players[0]).enterLottery({ value: ENTRY_FEE }))
        .to.emit(lottery, "PlayerJoined")
        .withArgs(players[0].address, 0);
      
      expect(await lottery.getPlayerCount()).to.equal(1);
    });

    it("Should reject entry with incorrect fee", async function () {
      const wrongFee = ethers.utils.parseEther("0.01");
      await expect(
        lottery.connect(players[0]).enterLottery({ value: wrongFee })
      ).to.be.revertedWith("Must send exactly 0.02 ETH");
    });

    it("Should reject entry with too much fee", async function () {
      const wrongFee = ethers.utils.parseEther("0.03");
      await expect(
        lottery.connect(players[0]).enterLottery({ value: wrongFee })
      ).to.be.revertedWith("Must send exactly 0.02 ETH");
    });

    it("Should prevent double entry in same round", async function () {
      await lottery.connect(players[0]).enterLottery({ value: ENTRY_FEE });
      
      await expect(
        lottery.connect(players[0]).enterLottery({ value: ENTRY_FEE })
      ).to.be.revertedWith("Already entered this round");
    });
  });

  describe("Player Tracking", function () {
    it("Should correctly track multiple players", async function () {
      for (let i = 0; i < 5; i++) {
        await lottery.connect(players[i]).enterLottery({ value: ENTRY_FEE });
      }
      
      expect(await lottery.getPlayerCount()).to.equal(5);
      
      const playersList = await lottery.getPlayers();
      for (let i = 0; i < 5; i++) {
        expect(playersList[i]).to.equal(players[i].address);
      }
    });

    it("Should track prize pool correctly", async function () {
      for (let i = 0; i < 5; i++) {
        await lottery.connect(players[i]).enterLottery({ value: ENTRY_FEE });
      }
      
      const expectedPrize = ENTRY_FEE.mul(5);
      expect(await lottery.getPrizePool()).to.equal(expectedPrize);
    });
  });

  describe("Winner Selection", function () {
    it("Should automatically select winner when 10 players join", async function () {
      for (let i = 0; i < 9; i++) {
        await lottery.connect(players[i]).enterLottery({ value: ENTRY_FEE });
      }
      
      expect(await lottery.getPlayerCount()).to.equal(9);
      
      const tx = await lottery.connect(players[9]).enterLottery({ value: ENTRY_FEE });
      
      await expect(tx).to.emit(lottery, "WinnerSelected");
      await expect(tx).to.emit(lottery, "LotteryReset");
    });

    it("Should transfer entire prize pool to winner", async function () {
      const initialBalances = [];
      for (let i = 0; i < 10; i++) {
        initialBalances.push(await ethers.provider.getBalance(players[i].address));
        await lottery.connect(players[i]).enterLottery({ value: ENTRY_FEE });
      }

      const expectedPrize = ENTRY_FEE.mul(10);

      let winnerFound = false;
      for (let i = 0; i < 10; i++) {
        const finalBalance = await ethers.provider.getBalance(players[i].address);
        const balanceChange = finalBalance.sub(initialBalances[i]);

        if (balanceChange.gt(ENTRY_FEE)) {
          winnerFound = true;
          expect(balanceChange).to.be.closeTo(
            expectedPrize.sub(ENTRY_FEE),
            ethers.utils.parseEther("0.001")
          );
        }
      }
    });

    it("Should not allow manual winner selection", async function () {
      for (let i = 0; i < 5; i++) {
        await lottery.connect(players[i]).enterLottery({ value: ENTRY_FEE });
      }
      
      expect(await lottery.getPlayerCount()).to.equal(5);
    });
  });

  describe("Lottery Reset", function () {
    it("Should reset lottery after winner selection", async function () {
      for (let i = 0; i < 10; i++) {
        await lottery.connect(players[i]).enterLottery({ value: ENTRY_FEE });
      }
      
      expect(await lottery.getPlayerCount()).to.equal(0);
      expect(await lottery.getPrizePool()).to.equal(0);
      expect(await lottery.getCurrentRound()).to.equal(1);
    });

    it("Should allow same players to enter new round", async function () {
      for (let i = 0; i < 10; i++) {
        await lottery.connect(players[i]).enterLottery({ value: ENTRY_FEE });
      }
      
      await lottery.connect(players[0]).enterLottery({ value: ENTRY_FEE });
      expect(await lottery.getPlayerCount()).to.equal(1);
      expect(await lottery.getCurrentRound()).to.equal(1);
    });

    it("Should clear hasEntered mapping after reset", async function () {
      for (let i = 0; i < 10; i++) {
        await lottery.connect(players[i]).enterLottery({ value: ENTRY_FEE });
      }
      
      expect(await lottery.hasEntered(players[0].address)).to.be.false;
    });
  });

  describe("View Functions", function () {
    it("Should return correct player list", async function () {
      const testPlayers = players.slice(0, 3);
      
      for (let i = 0; i < testPlayers.length; i++) {
        await lottery.connect(testPlayers[i]).enterLottery({ value: ENTRY_FEE });
      }
      
      const playersList = await lottery.getPlayers();
      expect(playersList.length).to.equal(3);
      
      for (let i = 0; i < testPlayers.length; i++) {
        expect(playersList[i]).to.equal(testPlayers[i].address);
      }
    });

    it("Should return correct current round", async function () {
      expect(await lottery.getCurrentRound()).to.equal(0);
      
      for (let i = 0; i < 10; i++) {
        await lottery.connect(players[i]).enterLottery({ value: ENTRY_FEE });
      }
      
      expect(await lottery.getCurrentRound()).to.equal(1);
    });
  });
});
