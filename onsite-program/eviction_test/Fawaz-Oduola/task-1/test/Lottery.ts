import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { Lottery } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("Lottery", function () {
  async function deployLotteryFixture() {
    const [owner, ...players]: SignerWithAddress[] = await ethers.getSigners();

    const Lottery = await ethers.getContractFactory("Lottery");
    const lottery: Lottery = await Lottery.deploy();

    const entryFee = ethers.parseUnits("0.01", 18);
    const maxPlayers = 10;

    return { lottery, owner, players, entryFee, maxPlayers };
  }

  describe("Deployment", function () {
    it("Initial state should be correctly set", async function () {
      const { lottery } = await loadFixture(deployLotteryFixture);

      expect(await lottery.getLotteryId()).to.equal(1);
      expect(await lottery.getPlayerCount()).to.equal(0);
      expect(await lottery.getPrizePool()).to.equal(0);
    });
  });

  describe("Joining the Lottery", function () {
    it("Accepts a player when they send the exact entry fee", async function () {
      const { lottery, players, entryFee } =
        await loadFixture(deployLotteryFixture);

      await expect(lottery.connect(players[0]).joinLottery({ value: entryFee }))
        .to.emit(lottery, "PlayerJoined")
        .withArgs(players[0].address, 1, 1);

      expect(await lottery.getPlayerCount()).to.equal(1);
      expect(await lottery.getPrizePool()).to.equal(entryFee);
      expect(await lottery.hasPlayerJoined(players[0].address)).to.be.true;
    });

    it("Rejects players who pay less or more than the entry fee", async function () {
      const { lottery, players, entryFee } =
        await loadFixture(deployLotteryFixture);

      await expect(
        lottery.connect(players[0]).joinLottery({ value: entryFee - 1n }),
      ).to.be.revertedWithCustomError(lottery, "IncorrectEntryFee");

      await expect(
        lottery.connect(players[0]).joinLottery({ value: entryFee + 1n }),
      ).to.be.revertedWithCustomError(lottery, "IncorrectEntryFee");
    });

   
    it("Tracks multiple players joining correctly", async function () {
      const { lottery, players, entryFee } =
        await loadFixture(deployLotteryFixture);

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
    it("Picks a winner automatically after 10 players join", async function () {
      const { lottery, players, entryFee } =
        await loadFixture(deployLotteryFixture);

      for (let i = 0; i < 9; i++) {
        await lottery.connect(players[i]).joinLottery({ value: entryFee });
      }

      expect(await lottery.getPlayerCount()).to.equal(9);
      expect(await lottery.getLastWinner()).to.equal(ethers.ZeroAddress);

      const tx = await lottery
        .connect(players[9])
        .joinLottery({ value: entryFee });

      await expect(tx).to.emit(lottery, "WinnerSelected");
      await expect(tx).to.emit(lottery, "LotteryReset");

      expect(await lottery.getPlayerCount()).to.equal(0);
      expect(await lottery.getPrizePool()).to.equal(0);
      expect(await lottery.getLotteryId()).to.equal(2);
      expect(await lottery.getLastWinner()).to.not.equal(ethers.ZeroAddress);
    });

    it("Transfers the full prize pool to the selected winner", async function () {
      const { lottery, players, entryFee } =
        await loadFixture(deployLotteryFixture);

      const expectedPrize = entryFee * 10n;
      const balances: bigint[] = [];

      for (let i = 0; i < 10; i++) {
        balances[i] = await ethers.provider.getBalance(players[i].address);
      }

      const txs = [];
      for (let i = 0; i < 10; i++) {
        txs[i] = await lottery
          .connect(players[i])
          .joinLottery({ value: entryFee });
      }

      const winner = await lottery.getLastWinner();
      const winnerIndex = players.findIndex((p) => p.address === winner);

      expect(winnerIndex).to.be.greaterThan(-1);

      const receipt = await txs[winnerIndex].wait();
      const gasCost = receipt!.gasUsed * receipt!.gasPrice;

      const finalBalance = await ethers.provider.getBalance(
        players[winnerIndex].address,
      );
      const expectedBalance =
        balances[winnerIndex] - entryFee - gasCost + expectedPrize;

      expect(finalBalance).to.equal(expectedBalance);
    });

    it("Does not allow more than 10 participants per round", async function () {
      const { lottery, players, entryFee } =
        await loadFixture(deployLotteryFixture);

      for (let i = 0; i < 10; i++) {
        await lottery.connect(players[i]).joinLottery({ value: entryFee });
      }

      await expect(
        lottery.connect(players[10]).joinLottery({ value: entryFee }),
      )
        .to.emit(lottery, "PlayerJoined")
        .withArgs(players[10].address, 2, 1);
    });
  });

  describe("Lottery Reset", function () {
    it("Resets state after a round is completed", async function () {
      const { lottery, players, entryFee } =
        await loadFixture(deployLotteryFixture);

      for (let i = 0; i < 10; i++) {
        await lottery.connect(players[i]).joinLottery({ value: entryFee });
      }

      expect(await lottery.getPlayerCount()).to.equal(0);
      expect(await lottery.getPrizePool()).to.equal(0);
      expect(await lottery.getLotteryId()).to.equal(2);
      expect(await lottery.getSpotsRemaining()).to.equal(10);

      for (let i = 0; i < 10; i++) {
        expect(await lottery.hasPlayerJoined(players[i].address)).to.be.false;
      }

      const currentPlayers = await lottery.getPlayers();
      expect(currentPlayers.length).to.equal(0);
    });

    it("Lets previous players join again in the next round", async function () {
      const { lottery, players, entryFee } =
        await loadFixture(deployLotteryFixture);

      for (let i = 0; i < 10; i++) {
        await lottery.connect(players[i]).joinLottery({ value: entryFee });
      }

      await expect(lottery.connect(players[0]).joinLottery({ value: entryFee }))
        .to.emit(lottery, "PlayerJoined")
        .withArgs(players[0].address, 2, 1);

      expect(await lottery.hasPlayerJoined(players[0].address)).to.be.true;
      expect(await lottery.getLotteryId()).to.equal(2);
    });
  });

  describe("View Functions", function () {
    it("Returns all active players", async function () {
      const { lottery, players, entryFee } =
        await loadFixture(deployLotteryFixture);

      for (let i = 0; i < 3; i++) {
        await lottery.connect(players[i]).joinLottery({ value: entryFee });
      }

      const allPlayers = await lottery.getPlayers();
      expect(allPlayers.length).to.equal(3);
      expect(allPlayers[0]).to.equal(players[0].address);
      expect(allPlayers[1]).to.equal(players[1].address);
      expect(allPlayers[2]).to.equal(players[2].address);
    });

    it("Shows correct number of available spots", async function () {
      const { lottery, players, entryFee } =
        await loadFixture(deployLotteryFixture);

      expect(await lottery.getSpotsRemaining()).to.equal(10);

      await lottery.connect(players[0]).joinLottery({ value: entryFee });
      expect(await lottery.getSpotsRemaining()).to.equal(9);

      await lottery.connect(players[1]).joinLottery({ value: entryFee });
      expect(await lottery.getSpotsRemaining()).to.equal(8);
    });

    it("Displays the correct contract balance", async function () {
      const { lottery, players, entryFee } =
        await loadFixture(deployLotteryFixture);

      expect(await lottery.getContractBalance()).to.equal(0);

      await lottery.connect(players[0]).joinLottery({ value: entryFee });
      expect(await lottery.getContractBalance()).to.equal(entryFee);

      for (let i = 1; i < 10; i++) {
        await lottery.connect(players[i]).joinLottery({ value: entryFee });
      }
      expect(await lottery.getContractBalance()).to.equal(0);
    });
  });

  describe("Events", function () {
    it("Emits PlayerJoined with the correct details", async function () {
      const { lottery, players, entryFee } =
        await loadFixture(deployLotteryFixture);

      await expect(lottery.connect(players[0]).joinLottery({ value: entryFee }))
        .to.emit(lottery, "PlayerJoined")
        .withArgs(players[0].address, 1, 1);

      await expect(lottery.connect(players[1]).joinLottery({ value: entryFee }))
        .to.emit(lottery, "PlayerJoined")
        .withArgs(players[1].address, 1, 2);
    });

    it("Emits WinnerSelected and LotteryReset when round ends", async function () {
      const { lottery, players, entryFee } =
        await loadFixture(deployLotteryFixture);

      for (let i = 0; i < 9; i++) {
        await lottery.connect(players[i]).joinLottery({ value: entryFee });
      }

      const tx = lottery.connect(players[9]).joinLottery({ value: entryFee });

      await expect(tx)
        .to.emit(lottery, "WinnerSelected")
        .to.emit(lottery, "LotteryReset")
        .withArgs(2);
    });
  });



  describe("Gas Usage", function () {
    it("Keeps gas within reasonable limits", async function () {
      const { lottery, players, entryFee } =
        await loadFixture(deployLotteryFixture);

      const gasEstimates = [];

      for (let i = 0; i < 9; i++) {
        const tx = await lottery
          .connect(players[i])
          .joinLottery({ value: entryFee });
        const receipt = await tx.wait();
        gasEstimates.push(receipt!.gasUsed);
      }

      const finalTx = await lottery
        .connect(players[9])
        .joinLottery({ value: entryFee });
      const finalReceipt = await finalTx.wait();

      expect(finalReceipt!.gasUsed).to.be.greaterThan(gasEstimates[0]);
      expect(finalReceipt!.gasUsed).to.be.lessThan(1000000n);
    });
  });
});
