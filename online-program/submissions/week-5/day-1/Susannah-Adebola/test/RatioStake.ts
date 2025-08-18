const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("RatioStake", function () {
  it("should allow staking and mint Token B", async function () {
    const [owner, user] = await ethers.getSigners();
    const TokenA = await ethers.getContractFactory("ERC20Mock");
    const tokenA = await TokenA.deploy("Token A", "TA", owner.address, ethers.utils.parseEther("10000"));
    const TokenB = await ethers.getContractFactory("TokenBMock");
    const tokenB = await TokenB.deploy("Token B", "TB");

    // Deploy RatioStake with 1 day lock
    const RatioStake = await ethers.getContractFactory("RatioStake");
    const lockPeriod = 24 * 60 * 60;
    const ratioStake = await RatioStake.deploy(tokenA.address, tokenB.address, lockPeriod);

    // Approve and stake
    const stakeAmount = ethers.utils.parseEther("100");
    await tokenA.connect(owner).approve(ratioStake.address, stakeAmount);
    await ratioStake.connect(owner).stake(stakeAmount);

    // Check stake info
    const [amount, unlockTime] = await ratioStake.getStakeInfo(owner.address);
    expect(amount).to.equal(stakeAmount);
    expect(unlockTime).to.be.above(0);

    // Check Token B minted
    const tokenBBalance = await tokenB.balanceOf(owner.address);
    expect(tokenBBalance).to.equal(stakeAmount);
  });

  it("should allow unstaking after lock and burn Token B", async function () {
    const [owner] = await ethers.getSigners();

    const TokenA = await ethers.getContractFactory("ERC20Mock");
    const tokenA = await TokenA.deploy("Token A", "TA", owner.address, ethers.utils.parseEther("10000"));

    const TokenB = await ethers.getContractFactory("TokenBMock");
    const tokenB = await TokenB.deploy("Token B", "TB");

    const RatioStake = await ethers.getContractFactory("RatioStake");
    const lockPeriod = 1; // 1 second for test speed
    const ratioStake = await RatioStake.deploy(tokenA.address, tokenB.address, lockPeriod);

    const stakeAmount = ethers.utils.parseEther("100");
    await tokenA.approve(ratioStake.address, stakeAmount);
    await ratioStake.stake(stakeAmount);


    await ethers.provider.send("evm_increaseTime", [2]);
    await ethers.provider.send("evm_mine");

    await tokenB.approve(ratioStake.address, stakeAmount); // Only if burnFrom is used
    await ratioStake.unstake(stakeAmount);

    const finalTokenABalance = await tokenA.balanceOf(owner.address);
    expect(finalTokenABalance).to.equal(ethers.utils.parseEther("10000"));

    const tokenBBalance = await tokenB.balanceOf(owner.address);
    expect(tokenBBalance).to.equal(0);
  });
});

