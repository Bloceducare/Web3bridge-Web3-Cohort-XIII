const { ethers } = require("hardhat");

async function testStakingFlow() {
  const [deployer, user1, user2] = await ethers.getSigners();

  const deployResult = await require("./deploy.js")();

  const mockTokenA = await ethers.getContractAt(
    "MockTokenA",
    deployResult.mockTokenA
  );
  const stakingContract = await ethers.getContractAt(
    "StakingContract",
    deployResult.stakingContract
  );
  const rewardToken = await ethers.getContractAt(
    "RewardToken",
    deployResult.rewardToken
  );

  const stakeAmount = ethers.parseEther("100");
  const partialUnstakeAmount = ethers.parseEther("30");

  await mockTokenA.mint(user1.address, ethers.parseEther("1000"));
  await mockTokenA.mint(user2.address, ethers.parseEther("1000"));

  const user1InitialBalance = await mockTokenA.balanceOf(user1.address);

  await mockTokenA
    .connect(user1)
    .approve(stakingContract.getAddress(), stakeAmount);
  const stakeTx = await stakingContract.connect(user1).stake(stakeAmount);
  await stakeTx.wait();

  const [stakedAmount, unlockTime] = await stakingContract.getStakeInfo(
    user1.address
  );
  const rewardBalance = await rewardToken.balanceOf(user1.address);

  if (stakedAmount !== stakeAmount || rewardBalance !== stakeAmount) {
    throw new Error("Staking ratio incorrect");
  }

  const user2StakeAmount = ethers.parseEther("50");
  await mockTokenA
    .connect(user2)
    .approve(stakingContract.getAddress(), user2StakeAmount);
  await stakingContract.connect(user2).stake(user2StakeAmount);

  const [user2StakedAmount] = await stakingContract.getStakeInfo(user2.address);

  try {
    await stakingContract.connect(user1).unstake(partialUnstakeAmount);
    throw new Error("Early unstaking should have failed");
  } catch (error) {
    if (!error.message.includes("Tokens still locked")) {
      throw error;
    }
  }

  const canUnstakeNow = await stakingContract.canUnstake(user1.address);

  if (canUnstakeNow) {
    throw new Error("canUnstake should return false during lock period");
  }

  const lockPeriod = await stakingContract.lockPeriod();

  if (hre.network.name === "hardhat" || hre.network.name === "localhost") {
    await hre.network.provider.send("evm_increaseTime", [
      Number(lockPeriod) + 1,
    ]);
    await hre.network.provider.send("evm_mine");

    const canUnstakeAfter = await stakingContract.canUnstake(user1.address);

    if (!canUnstakeAfter) {
      throw new Error("canUnstake should return true after lock period");
    }

    const user1BalanceBeforeUnstake = await mockTokenA.balanceOf(user1.address);

    await stakingContract.connect(user1).unstake(partialUnstakeAmount);

    const user1BalanceAfterPartial = await mockTokenA.balanceOf(user1.address);
    const user1RewardAfterPartial = await rewardToken.balanceOf(user1.address);
    const [remainingStaked] = await stakingContract.getStakeInfo(user1.address);

    if (
      user1BalanceAfterPartial !==
      user1BalanceBeforeUnstake + partialUnstakeAmount
    ) {
      throw new Error("Partial unstaking failed");
    }

    if (user1RewardAfterPartial !== stakeAmount - partialUnstakeAmount) {
      throw new Error("Reward tokens not burned correctly");
    }

    if (remainingStaked !== stakeAmount - partialUnstakeAmount) {
      throw new Error("Remaining stake incorrect");
    }

    const remainingAmount = stakeAmount - partialUnstakeAmount;
    await stakingContract.connect(user1).unstake(remainingAmount);

    const user1FinalBalance = await mockTokenA.balanceOf(user1.address);
    const user1FinalReward = await rewardToken.balanceOf(user1.address);
    const [finalStaked, finalUnlockTime] = await stakingContract.getStakeInfo(
      user1.address
    );

    if (user1FinalBalance !== user1InitialBalance) {
      throw new Error("Final balance incorrect");
    }

    if (user1FinalReward !== 0n) {
      throw new Error("Reward tokens not fully burned");
    }

    if (finalStaked !== 0n || finalUnlockTime !== 0n) {
      throw new Error("Stake info not reset");
    }
  }
}
