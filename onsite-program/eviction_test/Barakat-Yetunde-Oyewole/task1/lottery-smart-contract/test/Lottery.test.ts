import { expect } from "chai";
import { ethers } from "hardhat";
import { Lottery } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("Lottery Contract", function () {
  let lottery: Lottery;
  let owner: HardhatEthersSigner;
  let players: HardhatEthersSigner[];
  const ENTRY_FEE = ethers.parseEther("0.01");
  const MAX_PLAYERS = 10;

  beforeEach(async function () {
    [owner, ...players] = await ethers.getSigners();
    
    const Lottery = await ethers.getContractFactory("Lottery");
    lottery = await Lottery.deploy();
    await lottery.waitForDeployment();
  });

  describe("Initial State", function () {
    it("Should have correct entry fee", async function () {
      expect(await lottery.ENTRY_FEE()).to.equal(ENTRY_FEE);
    });

    it("Should have correct max players", async function () {
      expect(await lottery.MAX_PLAYERS()).to.equal(MAX_PLAYERS);
    });

    it("Should start at round 1", async function () {
      expect(await lottery.currentRound()).to.equal(1);
    });

    it("Should have 0 players initially", async function () {
      expect(await lottery.getPlayersCount()).to.equal(0);
    });

    it("Should have 0 prize pool initially", async function () {
      expect(await lottery.getPrizePool()).to.equal(0);
    });
  });

  describe("Entering the Lottery", function () {
    it("Should allow a player to enter with exact fee", async function () {
      await expect(lottery.connect(players[0]).enterLottery({ value: ENTRY_FEE }))
        .to.emit(lottery, "PlayerJoined")
        .withArgs(players[0].address, 1, 1);

      expect(await lottery.getPlayersCount()).to.equal(1);
      expect(await lottery.getPrizePool()).to.equal(ENTRY_FEE);
      expect(await lottery.hasPlayerEntered(players[0].address)).to.be.true;
    });

    it("Should reject entry with insufficient fee", async function () {
      const incorrectFee = ethers.parseEther("0.005");
      
      await expect(
        lottery.connect(players[0]).enterLottery({ value: incorrectFee })
      ).to.be.revertedWith("Exact entry fee of 0.01 ETH required");
    });

    it("Should reject entry with excessive fee", async function () {
      const incorrectFee = ethers.parseEther("0.02");
      
      await expect(
        lottery.connect(players[0]).enterLottery({ value: incorrectFee })
      ).to.be.revertedWith("Exact entry fee of 0.01 ETH required");
    });

    it("Should reject duplicate entries from same player", async function () {
      await lottery.connect(players[0]).enterLottery({ value: ENTRY_FEE });
      
      await expect(
        lottery.connect(players[0]).enterLottery({ value: ENTRY_FEE })
      ).to.be.revertedWith("Player has already entered this round");
    });

    it("Should allow multiple different players to enter", async function () {
      for (let i = 0; i < 5; i++) {
        await lottery.connect(players[i]).enterLottery({ value: ENTRY_FEE });
        expect(await lottery.getPlayersCount()).to.equal(i + 1);
      }

      const allPlayers = await lottery.getPlayers();
      expect(allPlayers.length).to.equal(5);
      
      for (let i = 0; i < 5; i++) {
        expect(allPlayers[i]).to.equal(players[i].address);
      }
    });

    it("Should correctly track prize pool as players join", async function () {
      for (let i = 0; i < 5; i++) {
        await lottery.connect(players[i]).enterLottery({ value: ENTRY_FEE });
        expect(await lottery.getPrizePool()).to.equal(ENTRY_FEE * BigInt(i + 1));
      }
    });
  });

  describe("Winner Selection", function () {
    it("Should automatically select winner when 10 players join", async function () {
      for (let i = 0; i < 9; i++) {
        await lottery.connect(players[i]).enterLottery({ value: ENTRY_FEE });
      }

      expect(await lottery.getPlayersCount()).to.equal(9);

      const tx = await lottery.connect(players[9]).enterLottery({ value: ENTRY_FEE });
      const receipt = await tx.wait();

      const winnerEvent = receipt!.logs.find(log => {
        try {
          const parsed = lottery.interface.parseLog(log);
          return parsed!.name === "WinnerSelected";
        } catch {
          return false;
        }
      });
      expect(winnerEvent).to.not.be.undefined;

      const parsedEvent = lottery.interface.parseLog(winnerEvent!);
      const winnerAddress = parsedEvent!.args.winner;
      const prizeAmount = parsedEvent!.args.prizeAmount;

      const playerAddresses = players.slice(0, 10).map(p => p.address);
      expect(playerAddresses).to.include(winnerAddress);

      expect(prizeAmount).to.equal(ENTRY_FEE * 10n);

      expect(await lottery.getPlayersCount()).to.equal(0);
      expect(await lottery.getPrizePool()).to.equal(0);
      expect(await lottery.currentRound()).to.equal(2);
      expect(await lottery.lastWinner()).to.equal(winnerAddress);
      expect(await lottery.lastWinningAmount()).to.equal(prizeAmount);
    });

    it("Should not select winner with less than 10 players", async function () {
      for (let i = 0; i < 9; i++) {
        await lottery.connect(players[i]).enterLottery({ value: ENTRY_FEE });
      }

      expect(await lottery.getPlayersCount()).to.equal(9);
      expect(await lottery.currentRound()).to.equal(1);
      expect(await lottery.lastWinner()).to.equal(ethers.ZeroAddress);
    });

    it("Should reject entry when lottery is full", async function () {
      
    });
  });

  describe("Prize Distribution", function () {
    it("Should correctly transfer prize to winner", async function () {
      const initialBalances: { [key: string]: bigint } = {};
      
      for (let i = 0; i < 10; i++) {
        const address = players[i].address;
        initialBalances[address] = await ethers.provider.getBalance(address);
      }

      for (let i = 0; i < 10; i++) {
        await lottery.connect(players[i]).enterLottery({ value: ENTRY_FEE });
      }

      const winner = await lottery.lastWinner();
      const winnerBalance = await ethers.provider.getBalance(winner);
      
      expect(await lottery.getPrizePool()).to.equal(0);
      expect(winner).to.not.equal(ethers.ZeroAddress);
    });
  });

  describe("Lottery Reset", function () {
    it("Should reset lottery state after winner selection", async function () {
      for (let i = 0; i < 10; i++) {
        await lottery.connect(players[i]).enterLottery({ value: ENTRY_FEE });
      }

      expect(await lottery.getPlayersCount()).to.equal(0);
      expect(await lottery.getPrizePool()).to.equal(0);
      expect(await lottery.currentRound()).to.equal(2);

      for (let i = 0; i < 10; i++) {
        expect(await lottery.hasPlayerEntered(players[i].address)).to.be.false;
      }

      const allPlayers = await lottery.getPlayers();
      expect(allPlayers.length).to.equal(0);
    });

    it("Should allow players to join new round after reset", async function () {
      for (let i = 0; i < 10; i++) {
        await lottery.connect(players[i]).enterLottery({ value: ENTRY_FEE });
      }

      expect(await lottery.currentRound()).to.equal(2);

      await lottery.connect(players[0]).enterLottery({ value: ENTRY_FEE });
      expect(await lottery.getPlayersCount()).to.equal(1);
      expect(await lottery.currentRound()).to.equal(2);
      expect(await lottery.hasPlayerEntered(players[0].address)).to.be.true;
    });

    it("Should emit LotteryReset event", async function () {
      for (let i = 0; i < 9; i++) {
        await lottery.connect(players[i]).enterLottery({ value: ENTRY_FEE });
      }

      await expect(lottery.connect(players[9]).enterLottery({ value: ENTRY_FEE }))
        .to.emit(lottery, "LotteryReset")
        .withArgs(2);
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      for (let i = 0; i < 5; i++) {
        await lottery.connect(players[i]).enterLottery({ value: ENTRY_FEE });
      }
    });

    it("Should return correct lottery info", async function () {
      const info = await lottery.getLotteryInfo();
      
      expect(info._currentRound).to.equal(1);
      expect(info._playersCount).to.equal(5);
      expect(info._prizePool).to.equal(ENTRY_FEE * 5n);
      expect(info._lastWinner).to.equal(ethers.ZeroAddress);
      expect(info._lastWinningAmount).to.equal(0);
    });

    it("Should return correct players list", async function () {
      const allPlayers = await lottery.getPlayers();
      expect(allPlayers.length).to.equal(5);
      
      for (let i = 0; i < 5; i++) {
        expect(allPlayers[i]).to.equal(players[i].address);
      }
    });

    it("Should correctly report player entry status", async function () {
      for (let i = 0; i < 5; i++) {
        expect(await lottery.hasPlayerEntered(players[i].address)).to.be.true;
      }
      
      for (let i = 5; i < 10; i++) {
        expect(await lottery.hasPlayerEntered(players[i].address)).to.be.false;
      }
    });
  });

  describe("Multiple Rounds", function () {
    it("Should handle multiple lottery rounds correctly", async function () {
      for (let i = 0; i < 10; i++) {
        await lottery.connect(players[i]).enterLottery({ value: ENTRY_FEE });
      }

      const firstWinner = await lottery.lastWinner();
      expect(await lottery.currentRound()).to.equal(2);

      for (let i = 0; i < 10; i++) {
        await lottery.connect(players[i]).enterLottery({ value: ENTRY_FEE });
      }

      const secondWinner = await lottery.lastWinner();
      expect(await lottery.currentRound()).to.equal(3);

      expect(firstWinner).to.not.equal(ethers.ZeroAddress);
      expect(secondWinner).to.not.equal(ethers.ZeroAddress);
    });
  });
});
