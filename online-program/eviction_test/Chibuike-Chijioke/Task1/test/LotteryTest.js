const { ethers } = require("hardhat");
const { expect } = require("chai");
const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("Lottery Contract", function () {
  const ENTRY_FEE = ethers.parseEther("0.01");

  async function deployLotteryFixture() {
    const Lottery = await ethers.getContractFactory("Lottery");
    const lottery = await Lottery.deploy();

    const [owner, ...players] = await ethers.getSigners();
    return { lottery, owner, players };
  }

  let lottery, owner, players;

  beforeEach(async () => {
    ({ lottery, owner, players } = await loadFixture(deployLotteryFixture));
  });

  it("should initialize with roundNumber = 1", async () => {
    const round = await lottery.getCurrentRound();
    expect(round).to.equal(1);
  });

  it("should allow a player to enter with exact fee", async () => {
    await lottery.connect(players[0]).enterLottery({ value: ENTRY_FEE });

    const participants = await lottery.getParticipants();
    expect(participants).to.include(players[0].address);
  });

  it("should reject entry with incorrect fee", async () => {
    await expect(
      lottery.connect(players[1]).enterLottery({ value: ENTRY_FEE - 1n })
    ).to.be.revertedWith("Invalid entry fee");
  });

  it("should reject duplicate entry in the same round", async () => {
    await lottery.connect(players[2]).enterLottery({ value: ENTRY_FEE });

    await expect(
      lottery.connect(players[2]).enterLottery({ value: ENTRY_FEE })
    ).to.be.revertedWith("Already entered this round");
  });

  it("should start a new round after 10 players and allow new entries", async () => {
    for (let i = 0; i < 10; i++) {
      await lottery.connect(players[i]).enterLottery({ value: ENTRY_FEE });
    }

    const round = await lottery.getCurrentRound();
    expect(round).to.equal(2);

    await expect(
      lottery.connect(players[10]).enterLottery({ value: ENTRY_FEE })
    ).to.not.be.reverted;

    const participants = await lottery.getParticipants();
    expect(participants).to.include(players[10].address);
  });

  it("should select a winner and reset after 10 entries", async () => {
    const initialBalances = await Promise.all(
      players.slice(0, 10).map((p) => ethers.provider.getBalance(p.address))
    );

    const txs = [];
    for (let i = 0; i < 10; i++) {
      txs.push(lottery.connect(players[i]).enterLottery({ value: ENTRY_FEE }));
    }
    await Promise.all(txs);

    const round = await lottery.getCurrentRound();
    expect(round).to.equal(2);

    const participants = await lottery.getParticipants();
    expect(participants.length).to.equal(0);

    const prizePool = await lottery.getPrizePool();
    expect(prizePool).to.equal(0);
  });
});
