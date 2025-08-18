const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Lottery Contract", function () {
  let lottery;
  let owner;
  let players;
  const ENTRY_FEE = ethers.utils.parseEther("0.01");
  const MAX_PLAYERS = 10;

  beforeEach(async function () {
    [owner, ...players] = await ethers.getSigners();

    const Lottery = await ethers.getContractFactory("Lottery");
    lottery = await Lottery.deploy();
    await lottery.deployed();
  });

  describe("Deployment", function () {
    it("Should initialize with round 1", async function () {
      expect(await lottery.getCurrentRound()).to.equal(1);
    });

    it("Should have correct entry fee", async function () {
      expect(await lottery.ENTRY_FEE()).to.equal(ENTRY_FEE);
    });

    it("Should have correct max players", async function () {
      expect(await lottery.MAX_PLAYERS()).to.equal(MAX_PLAYERS);
    });

    it("Should start with no players", async function () {
      expect(await lottery.getPlayerCount()).to.equal(0);
    });
  });

  describe("Joining the Lottery", function () {
    it("Should allow users to join with correct entry fee", async function () {
      const tx = await lottery.connect(players[0]).joinLottery({ value: ENTRY_FEE });
      
      expect(await lottery.getPlayerCount()).to.equal(1);
      expect(await lottery.hasPlayerJoined(players[0].address)).to.be.true;
      
      await expect(tx)
        .to.emit(lottery, "PlayerJoined")
        .withArgs(players[0].address, 1, 1);
    });

    it("Should correctly track multiple players", async function () {
      for (let i = 0; i < 5; i++) {
        await lottery.connect(players[i]).joinLottery({ value: ENTRY_FEE });
      }

      expect(await lottery.getPlayerCount()).to.equal(5);
      
      const playersList = await lottery.getPlayers();
      expect(playersList).to.have.lengthOf(5);
      
      for (let i = 0; i < 5; i++) {
        expect(playersList[i]).to.equal(players[i].address);
        expect(await lottery.hasPlayerJoined(players[i].address)).to.be.true;
      }
    });

    it("Should update prize pool correctly", async function () {
      for (let i = 0; i < 3; i++) {
        await lottery.connect(players[i]).joinLottery({ value: ENTRY_FEE });
      }

      const expectedPrizePool = ENTRY_FEE.mul(3);
      expect(await lottery.getPrizePool()).to.equal(expectedPrizePool);
    });
  });

  describe("Winner Selection and Prize Distribution", function () {
    it("Should automatically select a winner after 10 players join", async function () {
      for (let i = 0; i < 9; i++) {
        await lottery.connect(players[i]).joinLottery({ value: ENTRY_FEE });
      }

      expect(await lottery.getLastWinner()).to.equal(ethers.constants.AddressZero);
      expect(await lottery.getPlayerCount()).to.equal(9);

      const tx = await lottery.connect(players[9]).joinLottery({ value: ENTRY_FEE });

      await expect(tx)
        .to.emit(lottery, "WinnerSelected")
        .to.emit(lottery, "LotteryReset");

      expect(await lottery.getPlayerCount()).to.equal(0);
      expect(await lottery.getCurrentRound()).to.equal(2);
    });

    it("Should transfer correct prize pool to winner", async function () {
      const initialBalances = [];
      for (let i = 0; i < 10; i++) {
        initialBalances[i] = await players[i].getBalance();
      }

      const transactions = [];
      for (let i = 0; i < 10; i++) {
        const tx = await lottery.connect(players[i]).joinLottery({ value: ENTRY_FEE });
        transactions[i] = tx;
      }

      const expectedPrizePool = ENTRY_FEE.mul(10);

      const winner = await lottery.getLastWinner();
      
      let winnerIndex = -1;
      for (let i = 0; i < 10; i++) {
        if (players[i].address === winner) {
          winnerIndex = i;
          break;
        }
      }

      expect(winnerIndex).to.not.equal(-1, "Winner should be one of the players");

      const winnerTx = transactions[winnerIndex];
      const receipt = await winnerTx.wait();
      const gasCost = receipt.gasUsed.mul(receipt.effectiveGasPrice);

      const finalBalance = await players[winnerIndex].getBalance();
      const expectedBalance = initialBalances[winnerIndex].sub(ENTRY_FEE).sub(gasCost).add(expectedPrizePool);
      
      expect(finalBalance).to.equal(expectedBalance);

      expect(await ethers.provider.getBalance(lottery.address)).to.equal(0);
    });

    it("Should correctly reset lottery state after winner selection", async function () {
      for (let i = 0; i < 10; i++) {
        await lottery.connect(players[i]).joinLottery({ value: ENTRY_FEE });
      }

      expect(await lottery.getPlayerCount()).to.equal(0);
      expect(await lottery.getCurrentRound()).to.equal(2);
      expect(await lottery.getPrizePool()).to.equal(0);

      for (let i = 0; i < 5; i++) {
        expect(await lottery.hasPlayerJoined(players[i].address)).to.be.false;
      }

      await lottery.connect(players[0]).joinLottery({ value: ENTRY_FEE });
      expect(await lottery.getPlayerCount()).to.equal(1);
    });
  });

  describe("Multiple Rounds", function () {
    it("Should run multiple rounds successfully", async function () {
      for (let i = 0; i < 10; i++) {
        await lottery.connect(players[i]).joinLottery({ value: ENTRY_FEE });
      }

      expect(await lottery.getCurrentRound()).to.equal(2);
      const round1Winner = await lottery.getLastWinner();

      for (let i = 0; i < 10; i++) {
        await lottery.connect(players[i]).joinLottery({ value: ENTRY_FEE });
      }

      expect(await lottery.getCurrentRound()).to.equal(3);
      const round2Winner = await lottery.getLastWinner();

      expect(round1Winner).to.not.equal(ethers.constants.AddressZero);
      expect(round2Winner).to.not.equal(ethers.constants.AddressZero);
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      for (let i = 0; i < 3; i++) {
        await lottery.connect(players[i]).joinLottery({ value: ENTRY_FEE });
      }
    });

    it("Should return correct player count", async function () {
      expect(await lottery.getPlayerCount()).to.equal(3);
    });

    it("Should return correct players list", async function () {
      const playersList = await lottery.getPlayers();
      expect(playersList).to.have.lengthOf(3);
      
      for (let i = 0; i < 3; i++) {
        expect(playersList[i]).to.equal(players[i].address);
      }
    });

    it("Should return correct prize pool", async function () {
      const expectedPool = ENTRY_FEE.mul(3);
      expect(await lottery.getPrizePool()).to.equal(expectedPool);
    });

    it("Should correctly report if player has joined", async function () {
      expect(await lottery.hasPlayerJoined(players[0].address)).to.be.true;
      expect(await lottery.hasPlayerJoined(players[1].address)).to.be.true;
      expect(await lottery.hasPlayerJoined(players[2].address)).to.be.true;
      expect(await lottery.hasPlayerJoined(players[3].address)).to.be.false;
    });

    it("Should return correct current round", async function () {
      expect(await lottery.getCurrentRound()).to.equal(1);
    });
  });

  describe("Edge Cases", function () {
    it("Should handle exactly 10 players correctly", async function () {
      for (let i = 0; i < 10; i++) {
        const tx = await lottery.connect(players[i]).joinLottery({ value: ENTRY_FEE });
        
        if (i < 9) {
          expect(await lottery.getPlayerCount()).to.equal(i + 1);
        } else {
          await expect(tx).to.emit(lottery, "WinnerSelected");
          expect(await lottery.getPlayerCount()).to.equal(0);
        }
      }
    });

    it("Should prevent joining after lottery is full (during same transaction)", async function () {
      for (let i = 0; i < 10; i++) {
        await lottery.connect(players[i]).joinLottery({ value: ENTRY_FEE });
      }

      await expect(
        lottery.connect(players[10]).joinLottery({ value: ENTRY_FEE })
      ).to.not.be.reverted;

      expect(await lottery.getPlayerCount()).to.equal(1);
      expect(await lottery.getCurrentRound()).to.equal(2);
    });
  });

  describe("Events", function () {
    it("Should emit PlayerJoined event with correct parameters", async function () {
      const tx = await lottery.connect(players[0]).joinLottery({ value: ENTRY_FEE });
      
      await expect(tx)
        .to.emit(lottery, "PlayerJoined")
        .withArgs(players[0].address, 1, 1);
    });

    it("Should emit WinnerSelected and LotteryReset events", async function () {
      for (let i = 0; i < 9; i++) {
        await lottery.connect(players[i]).joinLottery({ value: ENTRY_FEE });
      }

      const tx = await lottery.connect(players[9]).joinLottery({ value: ENTRY_FEE });

      const receipt = await tx.wait();
      const winnerSelectedEvent = receipt.events.find(e => e.event === "WinnerSelected");
      
      expect(winnerSelectedEvent).to.not.be.undefined;
      expect(winnerSelectedEvent.args.round).to.equal(1);
      expect(winnerSelectedEvent.args.prizePool).to.equal(ENTRY_FEE.mul(10));

      await expect(tx)
        .to.emit(lottery, "LotteryReset")
        .withArgs(2);
    });
  });
});
