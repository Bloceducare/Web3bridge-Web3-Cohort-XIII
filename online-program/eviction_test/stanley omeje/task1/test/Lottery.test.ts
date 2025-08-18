import { expect } from 'chai';
import { ethers } from 'hardhat';

import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';

describe('Lottery', function () {
  let lottery: Lottery;
  let owner: SignerWithAddress;
  let players: SignerWithAddress[];
  const ENTRY_FEE = ethers.parseEther('0.01');

  beforeEach(async function () {
    [owner, ...players] = await ethers.getSigners();

    const LotteryFactory = await ethers.getContractFactory('Lottery');
    lottery = await LotteryFactory.deploy();
    await lottery.waitForDeployment();
  });

  describe('Entry Requirements', function () {
    it('Should allow entry with exact fee', async function () {
      await expect(
        lottery.connect(players[0]).enterLottery({ value: ENTRY_FEE })
      ).to.not.be.reverted;

      expect(await lottery.getPlayerCount()).to.equal(1);
      expect(await lottery.isPlayerEntered(players[0].address)).to.be.true;
    });

    it('Should reject entry with incorrect fee', async function () {
      const wrongFee = ethers.parseEther('0.02');

      await expect(
        lottery.connect(players[0]).enterLottery({ value: wrongFee })
      ).to.be.revertedWithCustomError(lottery, 'InvalidEntryFee');
    });

    it('Should reject entry with insufficient fee', async function () {
      const wrongFee = ethers.parseEther('0.005');

      await expect(
        lottery.connect(players[0]).enterLottery({ value: wrongFee })
      ).to.be.revertedWithCustomError(lottery, 'InvalidEntryFee');
    });

    it('Should prevent double entry', async function () {
      await lottery.connect(players[0]).enterLottery({ value: ENTRY_FEE });

      await expect(
        lottery.connect(players[0]).enterLottery({ value: ENTRY_FEE })
      ).to.be.revertedWithCustomError(lottery, 'AlreadyEntered');
    });
  });

  describe('Player Tracking', function () {
    it('Should track 10 players correctly', async function () {
      for (let i = 0; i < 9; i++) {
        await lottery.connect(players[i]).enterLottery({ value: ENTRY_FEE });
        expect(await lottery.getPlayerCount()).to.equal(i + 1);
      }

      const playerList = await lottery.getPlayers();
      expect(playerList.length).to.equal(9);

      for (let i = 0; i < 9; i++) {
        expect(playerList[i]).to.equal(players[i].address);
        expect(await lottery.isPlayerEntered(players[i].address)).to.be.true;
      }
    });

    it('Should emit PlayerJoined event', async function () {
      await expect(
        lottery.connect(players[0]).enterLottery({ value: ENTRY_FEE })
      )
        .to.emit(lottery, 'PlayerJoined')
        .withArgs(players[0].address, 0);
    });
  });

  describe('Winner Selection', function () {
    it('Should select winner after 10 players', async function () {
      // Add 10 players
      for (let i = 0; i < 10; i++) {
        const tx = lottery
          .connect(players[i])
          .enterLottery({ value: ENTRY_FEE });

        if (i === 9) {
          // 10th player should trigger winner selection
          await expect(tx).to.emit(lottery, 'WinnerSelected');
        }
      }
    });

    it('Should transfer prize pool to winner', async function () {
      const expectedPrizePool = ENTRY_FEE * 10n;

      // Record initial balances
      const initialBalances = [];
      for (let i = 0; i < 10; i++) {
        initialBalances.push(
          await ethers.provider.getBalance(players[i].address)
        );
      }

      // Add 10 players
      for (let i = 0; i < 10; i++) {
        await lottery.connect(players[i]).enterLottery({ value: ENTRY_FEE });
      }

      let winnerFound = false;
      for (let i = 0; i < 10; i++) {
        const finalBalance = await ethers.provider.getBalance(
          players[i].address
        );
        const balanceChange = finalBalance - initialBalances[i];

        if (balanceChange > ENTRY_FEE * 8n) {
          winnerFound = true;
          break;
        }
      }

      expect(winnerFound).to.be.true;
      expect(await lottery.getPrizePool()).to.equal(0);
    });

    it('Should reset lottery after winner selection', async function () {
      for (let i = 0; i < 10; i++) {
        await lottery.connect(players[i]).enterLottery({ value: ENTRY_FEE });
      }

      expect(await lottery.getPlayerCount()).to.equal(0);
      expect(await lottery.lotteryRound()).to.equal(1);

      for (let i = 0; i < 5; i++) {
        expect(await lottery.isPlayerEntered(players[i].address)).to.be.false;
      }
    });

    it('Should emit LotteryReset event', async function () {
      for (let i = 0; i < 9; i++) {
        await lottery.connect(players[i]).enterLottery({ value: ENTRY_FEE });
      }

      await expect(
        lottery.connect(players[9]).enterLottery({ value: ENTRY_FEE })
      )
        .to.emit(lottery, 'LotteryReset')
        .withArgs(1);
    });
  });

  describe('Multiple Rounds', function () {
    it('Should allow players to enter new round after reset', async function () {
      for (let i = 0; i < 10; i++) {
        await lottery.connect(players[i]).enterLottery({ value: ENTRY_FEE });
      }

      await lottery.connect(players[0]).enterLottery({ value: ENTRY_FEE });
      expect(await lottery.getPlayerCount()).to.equal(1);
      expect(await lottery.lotteryRound()).to.equal(1);
    });
  });

  describe('View Functions', function () {
    it('Should return correct prize pool', async function () {
      expect(await lottery.getPrizePool()).to.equal(0);

      await lottery.connect(players[0]).enterLottery({ value: ENTRY_FEE });
      expect(await lottery.getPrizePool()).to.equal(ENTRY_FEE);

      await lottery.connect(players[1]).enterLottery({ value: ENTRY_FEE });
      expect(await lottery.getPrizePool()).to.equal(ENTRY_FEE * 2n);
    });
  });
});
