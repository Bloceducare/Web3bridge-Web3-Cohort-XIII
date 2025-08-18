import { expect } from "chai";
import hre, { ethers } from "hardhat";

describe("Lottery", function () {
  async function deployLottery() {
    const [owner, ...accounts] = await hre.ethers.getSigners();
    const lotteryPrice = ethers.parseEther("0.01");

    const Lottery = await hre.ethers.getContractFactory("Lottery");
    const lottery = await Lottery.deploy(lotteryPrice);

    return { lottery, owner, accounts, lotteryPrice };
  }

  it("1. Users can enter only with the exact fee", async function () {
    const { lottery, accounts, lotteryPrice } = await deployLottery();

    await expect(
      lottery.connect(accounts[0]).joinLottery({ value: ethers.parseEther("0.002") })
    ).to.be.revertedWithCustomError(lottery, "Entry_fee_must_be_exactly_001_ETH");

    await expect(
      lottery.connect(accounts[0]).joinLottery({ value: lotteryPrice })
    ).to.emit(lottery, "PlayerJoined");
  });

  it("2. The contract correctly tracks players", async function () {
    const { lottery, accounts, lotteryPrice } = await deployLottery();

    // Join with first player
    await lottery.connect(accounts[0]).joinLottery({ value: lotteryPrice });
    
    // Check if player count is updated
    expect(await lottery.playersCount()).to.equal(1);
    
    // Check if player is marked as joined
    expect(await lottery.isParticipant(accounts[0].address)).to.be.true;
    expect(await lottery.isParticipant(accounts[1].address)).to.be.false;
  });

  it("3. Users cannot join twice in the same round", async function () {
    const { lottery, accounts, lotteryPrice } = await deployLottery();

    // First join should succeed
    await lottery.connect(accounts[0]).joinLottery({ value: lotteryPrice });
    
    // Second join should fail
    await expect(
      lottery.connect(accounts[0]).joinLottery({ value: lotteryPrice })
    ).to.be.revertedWithCustomError(lottery, "You_have_already_joined_this_round");
  });

  it("4. Only after 10 players, a winner is chosen", async function () {
    const { lottery, accounts, lotteryPrice } = await deployLottery();

    // Add 8 players
    for (let i = 0; i < 8; i++) {
      await lottery.connect(accounts[i]).joinLottery({ value: lotteryPrice });
    }

    // 9th player should not trigger winner selection
    await expect(
      lottery.connect(accounts[8]).joinLottery({ value: lotteryPrice })
    ).to.emit(lottery, "PlayerJoined").and.not.to.emit(lottery, "WinnerEvent");
    
    // 10th player should trigger winner selection
    await expect(
      lottery.connect(accounts[9]).joinLottery({ value: lotteryPrice })
    ).to.emit(lottery, "WinnerEvent");
  });

  it("5. The prize pool is transferred correctly to the winner", async function () {
    const { lottery, accounts, lotteryPrice } = await deployLottery();

    const participants = accounts.slice(0, 10);

    const balancesBefore = await Promise.all(
      participants.map((p) => ethers.provider.getBalance(p.address))
    );

    // Join lottery with all 10 players
    for (let i = 0; i < 10; i++) {
      await lottery.connect(participants[i]).joinLottery({ value: lotteryPrice });
    }

    const prizePool = lotteryPrice * 10n;

    const balancesAfter = await Promise.all(
      participants.map((p) => ethers.provider.getBalance(p.address))
    );

    // Find the winner by checking which account has a higher balance after the lottery
    const winnerIndex = balancesAfter.findIndex(
      (bal, i) => bal > balancesBefore[i] - (lotteryPrice / 2n) // Account for gas costs
    );

    expect(winnerIndex).to.not.equal(-1);
  });

  it("6. The lottery resets for the next round", async function () {
    const { lottery, accounts, lotteryPrice } = await deployLottery();

    // Complete first round with 10 players
    for (let i = 0; i < 10; i++) {
      await lottery.connect(accounts[i]).joinLottery({ value: lotteryPrice });
    }
    
    // After winner selection, player count should be reset to 0
    expect(await lottery.playersCount()).to.equal(0);
    
    // Previous participants should be able to join again in a new round
    await expect(
      lottery.connect(accounts[0]).joinLottery({ value: lotteryPrice })
    ).to.emit(lottery, "PlayerJoined");
    
    // Check that the lottery is still active
    expect(await lottery.lotteryActive()).to.be.true;
  });
  
  it("7. The contract handles edge cases properly", async function () {
    const { lottery, accounts, lotteryPrice } = await deployLottery();
    
    // Check that lottery price is set correctly
    expect(await lottery.lotteryPrice()).to.equal(lotteryPrice);
    
    // Check that the contract can receive ETH through fallback
    await accounts[0].sendTransaction({
      to: await lottery.getAddress(),
      value: ethers.parseEther("0.05")
    });
    
    // Contract balance should be updated
    expect(await ethers.provider.getBalance(await lottery.getAddress()))
      .to.equal(ethers.parseEther("0.05"));
  });
});
