const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Staking Contract", function () {
  let TokenA, TokenB, tokenA, tokenB, Staking, staking;
  let owner, user1, user2;
  const initialSupply = ethers.parseEther("1000000"); // 1M tokens
  const stakeAmount = ethers.parseEther("100");
  const lockPeriod = 60 * 60 * 24 * 7; // 1 week

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy TokenA and TokenB
    const TokenFactory = await ethers.getContractFactory("TokenA");
    tokenA = await TokenFactory.deploy();
    await tokenA.waitForDeployment();

    const TokenBFactory = await ethers.getContractFactory("TokenB");
    tokenB = await TokenBFactory.deploy();
    await tokenB.waitForDeployment();

    // Deploy staking contract
    const StakingFactory = await ethers.getContractFactory("Staking");
    staking = await StakingFactory.deploy(
      await tokenA.getAddress(),
      await tokenB.getAddress(),
      lockPeriod
    );
    await staking.waitForDeployment();

    // Give user1 some TokenA
    await tokenA.transfer(user1.address, stakeAmount);
  });

  describe("Stake", function () {
    it("should allow user to stake and mint TokenB", async function () {
      await tokenA.connect(user1).approve(await staking.getAddress(), stakeAmount);

      const tx = await staking.connect(user1).stake(stakeAmount);
      await tx.wait();

      const info = await staking.getStakeInfo(user1.address);
      expect(info[0]).to.equal(stakeAmount);

      const balanceB = await tokenB.balanceOf(user1.address);
      expect(balanceB).to.equal(stakeAmount);
    });

    it("should revert for zero stake", async function () {
      await expect(staking.connect(user1).stake(0)).to.be.revertedWith("Zero stake");
    });
  });

  describe("Unstake", function () {
    beforeEach(async function () {
      await tokenA.connect(user1).approve(await staking.getAddress(), stakeAmount);
      await staking.connect(user1).stake(stakeAmount);
    });

    it("should revert if trying to unstake before unlock time", async function () {
      await expect(staking.connect(user1).unstake(stakeAmount)).to.be.revertedWithCustomError(
        staking,
        "TokensLocked"
      );
    });

    it("should allow unstake after lock period", async function () {
      // Fast-forward time
      await ethers.provider.send("evm_increaseTime", [lockPeriod + 1]);
      await ethers.provider.send("evm_mine");

      // Approve tokenB burn
      await tokenB.connect(user1).approve(await staking.getAddress(), stakeAmount);

      const before = await tokenA.balanceOf(user1.address);
      await staking.connect(user1).unstake(stakeAmount);
      const after = await tokenA.balanceOf(user1.address);

      expect(after).to.be.greaterThan(before);

      const updatedInfo = await staking.getStakeInfo(user1.address);
      expect(updatedInfo[0]).to.equal(0);
    });

    it("should revert if user tries to unstake more than staked", async function () {
      await ethers.provider.send("evm_increaseTime", [lockPeriod + 1]);
      await ethers.provider.send("evm_mine");

      const tooMuch = ethers.parseEther("200");
      await expect(staking.connect(user1).unstake(tooMuch)).to.be.revertedWithCustomError(
        staking,
        "InsufficientStake"
      );
    });
  });
});
