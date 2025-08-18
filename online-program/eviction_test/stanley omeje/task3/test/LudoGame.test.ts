import { expect } from 'chai';
import { ethers } from 'hardhat';

describe('Lottery', function () {
  let lottery: any;
  let players: any[];
  const entryFee = ethers.parseEther('0.01');

  beforeEach(async function () {
    const signers = await ethers.getSigners();
    players = signers;

    const LotteryFactory = await ethers.getContractFactory('Lottery');
    lottery = await LotteryFactory.deploy();
    await lottery.waitForDeployment();
  });

  it('allows entry with correct fee', async function () {
    await lottery.connect(players[0]).enterLottery({ value: entryFee });
    expect(await lottery.getPlayerCount()).to.equal(1);
  });

  it('rejects wrong fee', async function () {
    const wrongFee = ethers.parseEther('0.02');
    await expect(
      lottery.connect(players[0]).enterLottery({ value: wrongFee })
    ).to.be.revertedWithCustomError(lottery, 'InvalidEntryFee');
  });

  it('prevents double entry', async function () {
    await lottery.connect(players[0]).enterLottery({ value: entryFee });
    await expect(
      lottery.connect(players[0]).enterLottery({ value: entryFee })
    ).to.be.revertedWithCustomError(lottery, 'AlreadyEntered');
  });

  it('tracks players correctly', async function () {
    for (let i = 0; i < 5; i++) {
      await lottery.connect(players[i]).enterLottery({ value: entryFee });
    }
    expect(await lottery.getPlayerCount()).to.equal(5);

    const playerList = await lottery.getPlayers();
    expect(playerList[0]).to.equal(players[0].address);
  });

  it('selects winner after 10 players', async function () {
    for (let i = 0; i < 9; i++) {
      await lottery.connect(players[i]).enterLottery({ value: entryFee });
    }

    await expect(
      lottery.connect(players[9]).enterLottery({ value: entryFee })
    ).to.emit(lottery, 'WinnerSelected');
  });

  it('resets after winner selection', async function () {
    for (let i = 0; i < 10; i++) {
      await lottery.connect(players[i]).enterLottery({ value: entryFee });
    }

    expect(await lottery.getPlayerCount()).to.equal(0);
    expect(await lottery.lotteryRound()).to.equal(1);
  });

  it('allows new round entries', async function () {
    for (let i = 0; i < 10; i++) {
      await lottery.connect(players[i]).enterLottery({ value: entryFee });
    }

    await lottery.connect(players[0]).enterLottery({ value: entryFee });
    expect(await lottery.getPlayerCount()).to.equal(1);
  });
});
