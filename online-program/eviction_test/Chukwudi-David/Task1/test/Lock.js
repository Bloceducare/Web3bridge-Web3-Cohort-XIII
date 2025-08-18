const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");

describe("Lock", function () {
  const FEE = ethers.parseEther("0.01");
  const MAX_PLAYERS = 10n;

  async function deployFixture() {
    const [owner, ...rest] = await ethers.getSigners();
    const Lottery = await ethers.getContractFactory("Lottery");
    const lottery = await Lottery.deploy(FEE);
    await lottery.waitForDeployment();
    return { lottery, owner, players: rest.slice(0, 12) };
  }

  describe("Test Lottery", function () {
  async function joinWith(lottery, signer, asPlayerAddr, value = FEE) {
    const player = asPlayerAddr ?? (await signer.getAddress());
    return lottery.connect(signer).joinLottery(player, { value });
  }

  it("1) Users can enter only with the exact fee", async () => {
    const { lottery, players } = await deployFixture();

    // wrong fee: zero
    await expect(joinWith(lottery, players[0], players[0].address, 0n))
      .to.be.revertedWithCustomError(lottery, "WrongFee");

    // wrong fee: too high
    await expect(
      joinWith(lottery, players[0], players[0].address, FEE + 1n)
    ).to.be.revertedWithCustomError(lottery, "WrongFee");

    // correct fee: works
    await expect(joinWith(lottery, players[0])).to.emit(
      lottery,
      "PlayerJoined"
    );
  });

  it("2) Tracks exactly 10 players and prevents duplicates", async () => {
    const { lottery, players } = await deployFixture();

    await joinWith(lottery, players[0]);
    expect(await lottery.playersCount()).to.equal(1n);

    // duplicate join
    await expect(joinWith(lottery, players[0])).to.be.revertedWithCustomError(
      lottery,
      "AlreadyJoined"
    );

    // fill up to 9
    for (let i = 1; i < 9; i++) {
      await joinWith(lottery, players[i]);
    }
    expect(await lottery.playersCount()).to.equal(9n);

    // 10th triggers reset
    await joinWith(lottery, players[9]);
    expect(await lottery.playersCount()).to.equal(0n);
  });

  it("3) Only after 10 players, a winner is chosen", async () => {
    const { lottery, players } = await deployFixture();

    // 9 players, no winner yet
    for (let i = 0; i < 9; i++) {
      await joinWith(lottery, players[i]);
      const storedWinner = await lottery.getWinnerById(1n);
      expect(storedWinner).to.equal(ethers.ZeroAddress);
    }

    // 10th triggers selection
    await expect(joinWith(lottery, players[9]))
      .to.emit(lottery, "WinnerSelected")
      .withArgs(
        ethers.anyValue, // winner addr
        ethers.parseEther("0.1"), // prize pool
        1n
      );

    const winner = await lottery.getWinnerById(1n);
    expect(winner).to.not.equal(ethers.ZeroAddress);
  });

  it("4) Prize pool is transferred correctly to the winner", async () => {
    const { lottery, players } = await deployFixture();

    // Join first 9 players
    for (let i = 0; i < 9; i++) {
      await joinWith(lottery, players[i]);
    }

    const addrs = await Promise.all(
      [...Array(9).keys()].map((i) => players[i].getAddress())
    );
    addrs.push(await players[9].getAddress());

    const before = {};
    for (const a of addrs) {
      before[a] = await ethers.provider.getBalance(a);
    }

    // Do the 10th join
    const tenthSigner = players[9];
    const tx = await joinWith(lottery, tenthSigner);
    const rcpt = await tx.wait();

    const prize = await lottery.prizeOf(1n);
    const winner = await lottery.winnerOf(1n);
    const afterWinnerBal = await ethers.provider.getBalance(winner);

    const winnerBefore = before[winner];
    let expectedDelta = prize;

    const tenthAddr = await tenthSigner.getAddress();
    if (winner.toLowerCase() === tenthAddr.toLowerCase()) {
      const gasUsed = rcpt.gasUsed;
      const gasPrice = rcpt.effectiveGasPrice;
      const gasCost = gasUsed * gasPrice;
      expectedDelta = prize - FEE - gasCost;
    }

    const actualDelta = afterWinnerBal - winnerBefore;
    expect(actualDelta).to.equal(expectedDelta);

    // contract empty after payout
    expect(
      await ethers.provider.getBalance(await lottery.getAddress())
    ).to.equal(0n);
  });

  it("5) Lottery resets for the next round", async () => {
    const { lottery, players } = await deployFixture();

    // Round 1 fill
    for (let i = 0; i < 10; i++) {
      await joinWith(lottery, players[i]);
    }

    expect(await lottery.playersCount()).to.equal(0n);
    expect(await lottery.roundId()).to.equal(2n);

    // same address can join in new round
    await expect(joinWith(lottery, players[0]))
      .to.emit(lottery, "PlayerJoined")
      .withArgs(await players[0].getAddress(), 2n, 1n);
  });
  });


});
