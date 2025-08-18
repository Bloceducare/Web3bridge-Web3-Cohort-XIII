const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
require("chai").should();

describe("Lottery Contract - Full Flow", function () {
  async function deployLotteryFixture() {
    const Lottery = await ethers.getContractFactory("Lottery");
    const [manager, ...players] = await ethers.getSigners();
    const lottery = await Lottery.deploy();
    await lottery.waitForDeployment();
    return { lottery, manager, players };
  }

  it("should allow users to enter with exact fee", async function () {
    const { lottery, players } = await loadFixture(deployLotteryFixture);
    const tx = await lottery.connect(players[0]).joinLottery("Alice", {
      value: ethers.parseEther("0.1"),
    });
    await tx.wait();

    const user = await lottery.users(players[0].address);
    user.name.should.equal("Alice");
    user.hasJoined.should.be.true;
  });

  it("should track exactly 10 players and choose winner", async function () {
    const { lottery, players } = await loadFixture(deployLotteryFixture);
    const entryFee = ethers.parseEther("0.1");

    for (let i = 0; i < 10; i++) {
      await lottery.connect(players[i]).joinLottery(`Player${i + 1}`, {
        value: entryFee,
      });
    }

    // After payout, players array should be reset
    await lottery.players(0).should.be.rejected;

    const prizePool = await lottery.prizePool();
    prizePool.should.equal(0);

    const lotteryId = await lottery.lotteryId();
    lotteryId.should.equal(2);
  });

  it("should transfer prize pool to winner", async function () {
    const { lottery, players } = await loadFixture(deployLotteryFixture);
    const entryFee = ethers.parseEther("0.1");

    for (let i = 0; i < 10; i++) {
      await lottery.connect(players[i]).joinLottery(`Player${i + 1}`, {
        value: entryFee,
      });
    }

    const filter = lottery.filters.WinnerPaid();
    const events = await lottery.queryFilter(filter);
    const winnerAddress = events[0].args.winner;
    const prizeAmount = events[0].args.amount;

    const winnerBalance = await ethers.provider.getBalance(winnerAddress);
    winnerBalance.should.be.at.least(prizeAmount);
    prizeAmount.should.equal(ethers.parseEther("1.0"));
  });
});
