const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('Lottery', function () {
  let Lottery, lottery;
  let owner, player1, player2, player10;

  before(async function () {
    [owner, player1, player2, , , , , , , player10] = await ethers.getSigners();

    Lottery = await ethers.getContractFactory('Lottery');
    lottery = await Lottery.deploy(ethers.utils.parseEther('0.1'), 1);
    await lottery.deployed();
  });

  it('Should set correct initial values', async function () {
    expect(await lottery.operator()).to.equal(owner.address);
    expect(await lottery.entryFee()).to.equal(ethers.utils.parseEther('0.1'));
    expect(await lottery.playerCount()).to.equal(0);
  });

  it('Should allow players to enter', async function () {
    await lottery.connect(player1).enterLottery({value: ethers.utils.parseEther('0.1')});
    expect(await lottery.playerCount()).to.equal(1);
  });

  it('Should prevent duplicate entries', async function () {
    await expect(
      lottery.connect(player1).enterLottery({value: ethers.utils.parseEther('0.1')})
    ).to.be.revertedWith("AlreadyEntered");
  });

  it('Should reject wrong entry fee', async function () {
    await expect(
      lottery.connect(player2).enterLottery({value: ethers.utils.parseEther('0.05')})
    ).to.be.revertedWith("WrongFee");
  });

  it('Should trigger winner selection when full', async function () {
    for (let i = 2; i <= 10; i++) {
      const player = await ethers.getSigner(i);
      await lottery.connect(player).enterLottery({value: ethers.utils.parseEther('0.1')});
    }
    expect(await lottery.playerCount()).to.equal(10);
  });

  it('Should select and pay winner', async function () {
    const requestId = 1;
    const randomWords = [ethers.BigNumber.from('123456')];
    await lottery.connect(owner).fulfillRandomWords(requestId, randomWords);

    expect(await lottery.winner()).to.not.equal(ethers.constants.AddressZero);
    expect(await lottery.playerCount()).to.equal(0);
  });

  it('Should reset after winner selection', async function () {
    expect(await lottery.playerCount()).to.equal(0);
    expect(await ethers.provider.getBalance(lottery.address)).to.equal(0);
  });
});