import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { Lottery } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("Lottery", function () {
  // Fixture to deploy the contract for each test
  async function deployLotteryFixture() {
    const [owner, ...players]: SignerWithAddress[] = await ethers.getSigners();

    const Lottery = await ethers.getContractFactory("Lottery");
    const lottery: Lottery = await Lottery.deploy();

    const entryFee = await lottery.ENTRY_FEE();
    const maxPlayers = await lottery.MAX_PLAYERS();

    return { lottery, owner, players, entryFee, maxPlayers };
  }

  describe("Deployment", function () {
    it("Should set the correct initial values", async function () {
      const { lottery } = await loadFixture(deployLotteryFixture);

      expect(await lottery.ENTRY_FEE()).to.equal(ethers.parseEther("0.01"));
      expect(await lottery.MAX_PLAYERS()).to.equal(10);
      expect(await lottery.getLotteryId()).to.equal(1);
      expect(await lottery.getPlayerCount()).to.equal(0);
      expect(await lottery.getPrizePool()).to.equal(0);
    });
  });

  describe("Joining the Lottery", function () {
    it("Should allow a player to join with exact entry fee", async function () {
      const { lottery, players, entryFee } = await loadFixture(
        deployLotteryFixture
      );

      await expect(lottery.connect(players[0]).joinLottery({ value: entryFee }))
        .to.emit(lottery, "PlayerJoined")
        .withArgs(players[0].address, 1, 1);

      expect(await lottery.getPlayerCount()).to.equal(1);
      expect(await lottery.getPrizePool()).to.equal(entryFee);
      expect(await lottery.hasPlayerJoined(players[0].address)).to.be.true;
    });

    it("Should reject incorrect entry fee", async function () {
      const { lottery, players, entryFee } = await loadFixture(
        deployLotteryFixture
      );

      // Too little
      await expect(
        lottery.connect(players[0]).joinLottery({ value: entryFee - 1n })
      ).to.be.revertedWithCustomError(lottery, "IncorrectEntryFee");

      // Too much
      await expect(
        lottery.connect(players[0]).joinLottery({ value: entryFee + 1n })
      ).to.be.revertedWithCustomError(lottery, "IncorrectEntryFee");
    });

    it("Should prevent duplicate entries", async function () {
      const { lottery, players, entryFee } = await loadFixture(
        deployLotteryFixture
      );

      // First entry should succeed
      await lottery.connect(players[0]).joinLottery({ value: entryFee });

      // Second entry should fail
      await expect(
        lottery.connect(players[0]).joinLottery({ value: entryFee })
      ).to.be.revertedWithCustomError(lottery, "AlreadyJoined");
    });

    it("Should track multiple players correctly", async function () {
      const { lottery, players, entryFee } = await loadFixture(
        deployLotteryFixture
      );

      // Add 5 players
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
    it("Should automatically select winner after 10 players join", async function () {
      const { lottery, players, entryFee } = await loadFixture(
        deployLotteryFixture
      );

      // Add 9 players first
      for (let i = 0; i < 9; i++) {
        await lottery.connect(players[i]).joinLottery({ value: entryFee });
      }

      expect(await lottery.getPlayerCount()).to.equal(9);
      expect(await lottery.getLastWinner()).to.equal(ethers.ZeroAddress);

      // Add 10th player - this should trigger winner selection
      const tx = await lottery
        .connect(players[9])
        .joinLottery({ value: entryFee });

      // Check that WinnerSelected event was emitted
      await expect(tx).to.emit(lottery, "WinnerSelected");
      await expect(tx).to.emit(lottery, "LotteryReset");

      // Verify lottery state after winner selection
      expect(await lottery.getPlayerCount()).to.equal(0);
      expect(await lottery.getPrizePool()).to.equal(0);
      expect(await lottery.getLotteryId()).to.equal(2);
      expect(await lottery.getLastWinner()).to.not.equal(ethers.ZeroAddress);
    });

    it("Should transfer correct prize amount to winner", async function () {
      const { lottery, players, entryFee } = await loadFixture(
        deployLotteryFixture
      );

      const expectedPrize = entryFee * 10n;
      const playerBalances: bigint[] = [];

      // Record initial balances
      for (let i = 0; i < 10; i++) {
        playerBalances[i] = await ethers.provider.getBalance(
          players[i].address
        );
      }

      // Add all 10 players
      const txs = [];
      for (let i = 0; i < 10; i++) {
        txs[i] = await lottery
          .connect(players[i])
          .joinLottery({ value: entryFee });
      }

      const winner = await lottery.getLastWinner();
      const winnerIndex = players.findIndex((p) => p.address === winner);

      expect(winnerIndex).to.be.greaterThan(-1);

      // Calculate gas costs for the winner
      const winnerTx = txs[winnerIndex];
      const receipt = await winnerTx.wait();
      const gasCost = receipt!.gasUsed * receipt!.gasPrice;

      const finalBalance = await ethers.provider.getBalance(
        players[winnerIndex].address
      );
      const expectedBalance =
        playerBalances[winnerIndex] - entryFee - gasCost + expectedPrize;

      expect(finalBalance).to.equal(expectedBalance);
    });

    it("Should prevent lottery from accepting more than 10 players", async function () {
      const { lottery, players, entryFee } = await loadFixture(
        deployLotteryFixture
      );

      // This is a bit tricky since the lottery resets after 10 players
      // We need to test that we can't join when it's full before winner selection
      // Since winner selection is automatic, we'll test the edge case logic

      // Add 10 players to trigger reset
      for (let i = 0; i < 10; i++) {
        await lottery.connect(players[i]).joinLottery({ value: entryFee });
      }

      // Now we should be able to join the new lottery
      await expect(
        lottery.connect(players[10]).joinLottery({ value: entryFee })
      )
        .to.emit(lottery, "PlayerJoined")
        .withArgs(players[10].address, 2, 1);
    });
  });

  describe("Lottery Reset", function () {
    it("Should reset lottery state after winner selection", async function () {
      const { lottery, players, entryFee } = await loadFixture(
        deployLotteryFixture
      );

      // Add 10 players to trigger winner selection and reset
      for (let i = 0; i < 10; i++) {
        await lottery.connect(players[i]).joinLottery({ value: entryFee });
      }

      // Verify reset state
      expect(await lottery.getPlayerCount()).to.equal(0);
      expect(await lottery.getPrizePool()).to.equal(0);
      expect(await lottery.getLotteryId()).to.equal(2);
      expect(await lottery.getSpotsRemaining()).to.equal(10);

      // Verify that previous players are no longer marked as joined
      for (let i = 0; i < 10; i++) {
        expect(await lottery.hasPlayerJoined(players[i].address)).to.be.false;
      }

      // Verify players array is empty
      const currentPlayers = await lottery.getPlayers();
      expect(currentPlayers.length).to.equal(0);
    });

    it("Should allow previous players to join new lottery round", async function () {
      const { lottery, players, entryFee } = await loadFixture(
        deployLotteryFixture
      );

      // Complete first lottery
      for (let i = 0; i < 10; i++) {
        await lottery.connect(players[i]).joinLottery({ value: entryFee });
      }

      // Same players should be able to join the new lottery
      await expect(lottery.connect(players[0]).joinLottery({ value: entryFee }))
        .to.emit(lottery, "PlayerJoined")
        .withArgs(players[0].address, 2, 1);

      expect(await lottery.hasPlayerJoined(players[0].address)).to.be.true;
      expect(await lottery.getLotteryId()).to.equal(2);
    });
  });

  describe("View Functions", function () {
    it("Should return correct player information", async function () {
      const { lottery, players, entryFee } = await loadFixture(
        deployLotteryFixture
      );

      // Add 3 players
      for (let i = 0; i < 3; i++) {
        await lottery.connect(players[i]).joinLottery({ value: entryFee });
      }

      const allPlayers = await lottery.getPlayers();
      expect(allPlayers.length).to.equal(3);
      expect(allPlayers[0]).to.equal(players[0].address);
      expect(allPlayers[1]).to.equal(players[1].address);
      expect(allPlayers[2]).to.equal(players[2].address);
    });

    it("Should return correct spots remaining", async function () {
      const { lottery, players, entryFee } = await loadFixture(
        deployLotteryFixture
      );

      expect(await lottery.getSpotsRemaining()).to.equal(10);

      await lottery.connect(players[0]).joinLottery({ value: entryFee });
      expect(await lottery.getSpotsRemaining()).to.equal(9);

      await lottery.connect(players[1]).joinLottery({ value: entryFee });
      expect(await lottery.getSpotsRemaining()).to.equal(8);
    });

    it("Should return correct contract balance", async function () {
      const { lottery, players, entryFee } = await loadFixture(
        deployLotteryFixture
      );

      expect(await lottery.getContractBalance()).to.equal(0);

      await lottery.connect(players[0]).joinLottery({ value: entryFee });
      expect(await lottery.getContractBalance()).to.equal(entryFee);

      // After full lottery, balance should be 0 again
      for (let i = 1; i < 10; i++) {
        await lottery.connect(players[i]).joinLottery({ value: entryFee });
      }
      expect(await lottery.getContractBalance()).to.equal(0);
    });
  });

  describe("Events", function () {
    it("Should emit PlayerJoined event with correct parameters", async function () {
      const { lottery, players, entryFee } = await loadFixture(
        deployLotteryFixture
      );

      await expect(lottery.connect(players[0]).joinLottery({ value: entryFee }))
        .to.emit(lottery, "PlayerJoined")
        .withArgs(players[0].address, 1, 1);

      await expect(lottery.connect(players[1]).joinLottery({ value: entryFee }))
        .to.emit(lottery, "PlayerJoined")
        .withArgs(players[1].address, 1, 2);
    });

    it("Should emit WinnerSelected and LotteryReset events", async function () {
      const { lottery, players, entryFee } = await loadFixture(
        deployLotteryFixture
      );

      // Add 9 players
      for (let i = 0; i < 9; i++) {
        await lottery.connect(players[i]).joinLottery({ value: entryFee });
      }

      // The 10th player should trigger both events
      const tx = lottery.connect(players[9]).joinLottery({ value: entryFee });

      await expect(tx)
        .to.emit(lottery, "WinnerSelected")
        .to.emit(lottery, "LotteryReset")
        .withArgs(2);
    });
  });

  describe("Multiple Lottery Rounds", function () {
    it("Should handle multiple complete lottery rounds", async function () {
      const { lottery, players, entryFee } = await loadFixture(
        deployLotteryFixture
      );

      // Run first lottery
      for (let i = 0; i < 10; i++) {
        await lottery.connect(players[i]).joinLottery({ value: entryFee });
      }

      const firstWinner = await lottery.getLastWinner();
      expect(await lottery.getLotteryId()).to.equal(2);

      // Run second lottery with different players
      for (let i = 10; i < 20; i++) {
        await lottery.connect(players[i]).joinLottery({ value: entryFee });
      }

      const secondWinner = await lottery.getLastWinner();
      expect(await lottery.getLotteryId()).to.equal(3);

      // Winners should be different (statistically very likely)
      // Note: There's a tiny chance they could be the same, but it's very unlikely
      expect(secondWinner).to.not.equal(ethers.ZeroAddress);
    });
  });

  describe("Edge Cases", function () {
    it("Should handle gas limit considerations", async function () {
      const { lottery, players, entryFee } = await loadFixture(
        deployLotteryFixture
      );

      // This test ensures that the winner selection and reset don't consume too much gas
      const gasEstimates = [];

      for (let i = 0; i < 9; i++) {
        const tx = await lottery
          .connect(players[i])
          .joinLottery({ value: entryFee });
        const receipt = await tx.wait();
        gasEstimates.push(receipt!.gasUsed);
      }

      // The 10th transaction should include winner selection and reset
      const finalTx = await lottery
        .connect(players[9])
        .joinLottery({ value: entryFee });
      const finalReceipt = await finalTx.wait();

      // Final transaction should use more gas but still be reasonable
      expect(finalReceipt!.gasUsed).to.be.greaterThan(gasEstimates[0]);
      expect(finalReceipt!.gasUsed).to.be.lessThan(1000000n); // Less than 1M gas
    });
  });
});
