const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Staking Contract", function () {
  let TokenA, TokenB, tokenA, tokenB;
  let Staking, staking;
  let owner, user;
  const lockPeriod = 60 * 60 * 24 * 7; // 7 days

  beforeEach(async () => {
    [owner, user] = await ethers.getSigners();

    TokenA = await ethers.getContractFactory("ERC20");
    tokenA = await TokenA.deploy("TokenA", "TKA");
    await tokenA.deployed();

    TokenB = await ethers.getContractFactory("ERC20Burnable");
    tokenB = await TokenB.deploy("TokenB", "TKB");
    await tokenB.deployed();

    // Mint tokens for user
    await tokenA.mint(user.address, ethers.utils.parseEther("1000"));
    await tokenB.mint(owner.address, ethers.utils.parseEther("1000")); // mint enough TokenB to fund staking

    Staking = await ethers.getContractFactory("Staking");
    staking = await Staking.deploy(tokenB.address, lockPeriod);
    await staking.deployed();

    // Transfer TokenB to staking contract to simulate reward pool
    await tokenB.transfer(staking.address, ethers.utils.parseEther("500"));
  });

  it("should allow a user to stake TokenA and receive TokenB", async () => {
    const amount = ethers.utils.parseEther("100");
    await tokenA.connect(user).approve(staking.address, amount);

    await expect(staking.connect(user).stake(user.address, tokenA.address, amount))
      .to.emit(staking, "Staked");

    const stakeDetails = await staking.getStakeDetails(user.address, tokenA.address);
    expect(stakeDetails.amount).to.equal(amount);

    const userTokenBBalance = await tokenB.balanceOf(user.address);
    expect(userTokenBBalance).to.equal(amount);
  });

  it("should not allow staking zero amount", async () => {
    await expect(
      staking.connect(user).stake(user.address, tokenA.address, 0)
    ).to.be.revertedWith("Amount must be > 0");
  });

  it("should not allow unstaking before lock period", async () => {
    const amount = ethers.utils.parseEther("100");
    await tokenA.connect(user).approve(staking.address, amount);
    await staking.connect(user).stake(user.address, tokenA.address, amount);

    await tokenB.connect(user).approve(staking.address, amount);

    await expect(
      staking.connect(user).unstake(user.address, tokenA.address, amount)
    ).to.be.revertedWith("Still locked");
  });

  it("should allow unstaking after lock period", async () => {
    const amount = ethers.utils.parseEther("100");
    await tokenA.connect(user).approve(staking.address, amount);
    await staking.connect(user).stake(user.address, tokenA.address, amount);

    await tokenB.connect(user).approve(staking.address, amount);

    // Increase time
    await ethers.provider.send("evm_increaseTime", [lockPeriod + 1]);
    await ethers.provider.send("evm_mine");

    await expect(staking.connect(user).unstake(user.address, tokenA.address, amount))
      .to.emit(staking, "Unstaked");

    const stakeDetails = await staking.getStakeDetails(user.address, tokenA.address);
    expect(stakeDetails.amount).to.equal(0);

    const finalTokenABalance = await tokenA.balanceOf(user.address);
    expect(finalTokenABalance).to.equal(ethers.utils.parseEther("1000"));
  });

  it("should fail if trying to unstake more than staked", async () => {
    const amount = ethers.utils.parseEther("100");
    await tokenA.connect(user).approve(staking.address, amount);
    await staking.connect(user).stake(user.address, tokenA.address, amount);

    await tokenB.connect(user).approve(staking.address, amount);

    await ethers.provider.send("evm_increaseTime", [lockPeriod + 1]);
    await ethers.provider.send("evm_mine");

    await expect(
      staking.connect(user).unstake(user.address, tokenA.address, ethers.utils.parseEther("200"))
    ).to.be.revertedWith("Not enough staked");
  });
});
