import { expect } from "chai";
import { ethers } from "hardhat";
import { Lottery } from "../typechain-types";

describe("Lottery", function () {
  let lottery: Lottery;
  let signers: Awaited<ReturnType<typeof ethers.getSigners>>;

  beforeEach(async function () {
    const Lottery = await ethers.getContractFactory("Lottery");
    signers = await ethers.getSigners();
    lottery = await Lottery.deploy();
    await lottery.waitForDeployment();
  });

  it("should allow entry with exact fee", async function () {
    await expect(lottery.connect(signers[0]).joinLottery({ value: ethers.parseEther("0.01") }))
      .to.emit(lottery, "PlayerJoined")
      .withArgs(signers[0].address);
    await expect(lottery.connect(signers[0]).joinLottery({ value: ethers.parseEther("0.02") })).to.be.revertedWithCustomError(
      lottery,
      "InsufficientFee"
    );
  });

  it("should track 10 players", async function () {
    for (let i = 0; i < 10; i++) {
      await lottery.connect(signers[i]).joinLottery({ value: ethers.parseEther("0.01") });
    }
    expect(await lottery.players(9)).to.equal(signers[9].address);
    expect((await lottery.players(0)).length).to.equal(10); // Verify 10 players are tracked
  });

  it("should select winner after 10 players", async function () {
    // Join with 10 unique signers
    for (let i = 0; i < 10; i++) {
      await lottery.connect(signers[i]).joinLottery({ value: ethers.parseEther("0.01") });
    }
    // Check state before selecting winner
    expect(await lottery.players.length).to.equal(10);
    // Trigger winner selection
    await expect(lottery.selectWinner()).to.emit(lottery, "WinnerSelected");
    const winner = await lottery.winner();
    expect(winner).to.not.equal(ethers.ZeroAddress);
    expect(signers.slice(0, 10).map(s => s.address)).to.include(winner); // Ensure winner is one of the 10
  });

  it("should transfer prize to winner", async function () {
    // Store initial balances for all 10 signers
    const initialBalances = await Promise.all(signers.slice(0, 10).map(s => ethers.provider.getBalance(s.address)));
    // Join with 10 unique signers
    for (let i = 0; i < 10; i++) {
      await lottery.connect(signers[i]).joinLottery({ value: ethers.parseEther("0.01") });
    }
    // Get contract balance before winner selection
    const contractBalanceBefore = await ethers.provider.getBalance(lottery.target);
    expect(contractBalanceBefore).to.equal(ethers.parseEther("0.1")); // 10 * 0.01 ETH
    // Select winner
    await lottery.selectWinner();
    const winner = await lottery.winner();
    const winnerIndex = signers.findIndex(s => s.address === winner);
    const finalBalance = await ethers.provider.getBalance(winner);
    const expectedPrize = ethers.parseEther("0.1"); // Total prize pool
    expect(finalBalance).to.be.closeTo(initialBalances[winnerIndex] + expectedPrize, ethers.parseEther("0.01")); // Allow for gas
  });

  it("should reset for next round", async function () {
    // Join with 10 unique signers
    for (let i = 0; i < 10; i++) {
      await lottery.connect(signers[i]).joinLottery({ value: ethers.parseEther("0.01") });
    }
    // Select winner
    await lottery.selectWinner();
    // Verify reset
    expect(await lottery.players(0)).to.equal(ethers.ZeroAddress);
    expect(await lottery.isReset()).to.be.true;
    // Test re-joining with the first signer
    await expect(lottery.connect(signers[0]).joinLottery({ value: ethers.parseEther("0.01") }))
      .to.emit(lottery, "PlayerJoined")
      .withArgs(signers[0].address);
  });
});