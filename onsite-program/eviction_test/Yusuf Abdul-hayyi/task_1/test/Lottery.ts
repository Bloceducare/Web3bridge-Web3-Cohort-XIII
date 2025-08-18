import { expect } from "chai";
import hre, { ethers } from "hardhat";

describe("Lottery", function () {
  async function deployLottery() {
    const [owner, ...accounts] = await hre.ethers.getSigners();
    const lotteryPrice = ethers.parseEther("0.01");

    const Lottery = await hre.ethers.getContractFactory("LotteryGame");
    const lottery = await Lottery.deploy(lotteryPrice);

    return { lottery, owner, accounts, lotteryPrice };
  }

  it("1. Should allow Users can enter only with the exact fee", async function () {
    const { lottery, accounts, lotteryPrice } = await deployLottery();

    await expect(
      lottery.connect(accounts[0]).joinLottery({ value: ethers.parseEther("0.002") })
    ).to.be.revertedWithCustomError(lottery, "Entry_fee_must_be_exactly_001_ETH");

    await expect(
      lottery.connect(accounts[0]).joinLottery({ value: lotteryPrice })
    ).to.emit(lottery, "PlayerJoined");
  });

  it("2. Should allow the contract correctly tracks 10 players", async function () {
    const { lottery, accounts, lotteryPrice } = await deployLottery();

    for (let i = 0; i < 10; i++) {
      await lottery.connect(accounts[i]).joinLottery({ value: lotteryPrice });
    }

    const tx = await lottery.connect(accounts[9]).joinLottery({ value: lotteryPrice });
    await expect(tx).to.emit(lottery, "WinnerEvent");
  });

  it("3. Only after 10 players, a winner is chosen", async function () {
    const { lottery, accounts, lotteryPrice } = await deployLottery();

    for (let i = 0; i < 9; i++) {
      await lottery.connect(accounts[i]).joinLottery({ value: lotteryPrice });
    }

    await expect(
      lottery.connect(accounts[8]).joinLottery({ value: lotteryPrice })
    ).to.emit(lottery, "PlayerJoined").and.not.to.emit(lottery, "WinnerEvent");
    const tx = lottery.connect(accounts[9]).joinLottery({ value: lotteryPrice });
    await expect(tx).to.be.revertedWithCustomError(lottery, "You_have_already_joined_this_round")
    await expect(tx).to.emit(lottery, "WinnerEvent");
  });

  it("4. The prize pool is transferred correctly to the winner", async function () {
    const { lottery, accounts, lotteryPrice } = await deployLottery();

    const participants = accounts.slice(0, 10);

    const balancesBefore = await Promise.all(
      participants.map((p) => ethers.provider.getBalance(p.address))
    );

    for (let i = 0; i < 10; i++) {
      await lottery.connect(participants[i]).joinLottery({ value: lotteryPrice });
    }

    const prizePool = lotteryPrice * 10n;

    const balancesAfter = await Promise.all(
      participants.map((p) => ethers.provider.getBalance(p.address))
    );

    const winnerIndex = balancesAfter.findIndex(
      (bal, i) => bal > balancesBefore[i]
    );

    expect(winnerIndex).to.not.equal(-1);
    // expect(balancesAfter[winnerIndex] - balancesBefore[winnerIndex]).to.be.closeTo(
    //   prizePool,
    //   ethers.parseEther("0.0000001")
    // );
  });

  it("5. The lottery resets for the next round", async function () {
    const { lottery, accounts, lotteryPrice } = await deployLottery();

    for (let i = 0; i < 10; i++) {
      await lottery.connect(accounts[i]).joinLottery({ value: lotteryPrice });
    }

    for (let i = 0; i < 10; i++) {
      const tx = lottery.connect(accounts[i]).joinLottery({ value: lotteryPrice });
      if (i === 9) {
        await expect(tx).to.emit(lottery, "WinnerEvent");
      }
    }
  });
});