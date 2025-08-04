import { ethers } from "hardhat";

async function main() {
    console.log("Starting Staking Contract Flow Test...\n");
    
    const [owner, user1, user2] = await ethers.getSigners();
    console.log(`Owner: ${await owner.getAddress()}`);
    console.log(`User1: ${await user1.getAddress()}`);
    console.log(`User2: ${await user2.getAddress()}\n`);
    
    console.log("📦 Deploying contracts...");
    const Token1 = await ethers.getContractFactory("Token1");
    const Token2 = await ethers.getContractFactory("Token2");
    const StakingContract = await ethers.getContractFactory("StakingContract");
    
    const token1 = await Token1.deploy();
    const token2 = await Token2.deploy();
    const stakingContract = await StakingContract.deploy(
        await token1.getAddress(),
        await token2.getAddress(),
        7 * 24 * 60 * 60 // 7 days
    );
    
    console.log(`Token1 deployed to: ${await token1.getAddress()}`);
    console.log(`Token2 deployed to: ${await token2.getAddress()}`);
    console.log(`StakingContract deployed to: ${await stakingContract.getAddress()}\n`);
    
    console.log("💰 Distributing initial tokens...");
    await token1.transfer(await user1.getAddress(), ethers.parseEther("1000"));
    await token1.transfer(await user2.getAddress(), ethers.parseEther("1000"));
    
    console.log(`User1 Token1 balance: ${ethers.formatEther(await token1.balanceOf(await user1.getAddress()))}`);
    console.log(`User2 Token1 balance: ${ethers.formatEther(await token1.balanceOf(await user2.getAddress()))}\n`);
    
    console.log("🔒 Testing staking functionality...");
    const stakeAmount = ethers.parseEther("100");
    
    await token1.connect(user1).approve(await stakingContract.getAddress(), stakeAmount);
    await stakingContract.connect(user1).stake(stakeAmount);
    
    console.log(`User1 staked ${ethers.formatEther(stakeAmount)} Token1`);
    console.log(`User1 Token1 balance: ${ethers.formatEther(await token1.balanceOf(await user1.getAddress()))}`);
    console.log(`User1 Token2 balance: ${ethers.formatEther(await token2.balanceOf(await user1.getAddress()))}`);
    
    const [stakedAmount, unlockTime] = await stakingContract.getStakeInfo(await user1.getAddress());
    console.log(`User1 staked amount: ${ethers.formatEther(stakedAmount)}`);
    console.log(`Unlock time: ${new Date(Number(unlockTime) * 1000).toLocaleString()}\n`);
    
    console.log("🔄 Testing unstaking before lock period...");
    await stakingContract.connect(user1).unstake(stakeAmount);
    
        console.log(`User1 Token2 balance after unstaking: ${ethers.formatEther(await token2.balanceOf(await user1.getAddress()))}`);
    console.log(`Pending unstake amount: ${ethers.formatEther(await stakingContract.getPendingUnstake(await user1.getAddress()))}`);
    console.log(`Can unstake now: ${await stakingContract.canUnstake(await user1.getAddress())}\n`);
    
    console.log("⏰ Fast forwarding time to unlock period...");
    await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60 + 1]);
    await ethers.provider.send("evm_mine", []);
    
    console.log("💸 Claiming unstaked tokens...");
    const balanceBefore = await token1.balanceOf(await user1.getAddress());
    await stakingContract.connect(user1).claimUnstaked();
    const balanceAfter = await token1.balanceOf(await user1.getAddress());
    
    console.log(`User1 Token1 balance before claim: ${ethers.formatEther(balanceBefore)}`);
    console.log(`User1 Token1 balance after claim: ${ethers.formatEther(balanceAfter)}`);
    console.log(`Claimed amount: ${ethers.formatEther(balanceAfter - balanceBefore)}\n`);
    
    console.log("🔄 Testing immediate unstaking after lock period...");
    await token1.connect(user1).approve(await stakingContract.getAddress(), stakeAmount);
    await stakingContract.connect(user1).stake(stakeAmount);
    
    const balanceBeforeUnstake = await token1.balanceOf(await user1.getAddress());
    await stakingContract.connect(user1).unstake(stakeAmount);
    const balanceAfterUnstake = await token1.balanceOf(await user1.getAddress());
    
    console.log(`User1 Token1 balance before immediate unstake: ${ethers.formatEther(balanceBeforeUnstake)}`);
    console.log(`User1 Token1 balance after immediate unstake: ${ethers.formatEther(balanceAfterUnstake)}`);
    console.log(`Immediately unstaked amount: ${ethers.formatEther(balanceAfterUnstake - balanceBeforeUnstake)}\n`);
    
    console.log("👥 Testing multiple users...");
    await token1.connect(user2).approve(await stakingContract.getAddress(), stakeAmount);
    await stakingContract.connect(user2).stake(stakeAmount);
    
    console.log(`User2 staked ${ethers.formatEther(stakeAmount)} Token1`);
    console.log(`User2 Token2 balance: ${ethers.formatEther(await token2.balanceOf(await user2.getAddress()))}`);
    
    await stakingContract.connect(user2).unstake(stakeAmount);
    await stakingContract.connect(user2).claimUnstaked();
    
    console.log(`User2 final Token1 balance: ${ethers.formatEther(await token1.balanceOf(await user2.getAddress()))}\n`);
    
    console.log("✅ Staking Contract Flow Test Completed Successfully!");
    console.log("\n📊 Final Balances:");
    console.log(`User1 Token1: ${ethers.formatEther(await token1.balanceOf(await user1.getAddress()))}`);
    console.log(`User1 Token2: ${ethers.formatEther(await token2.balanceOf(await user1.getAddress()))}`);
    console.log(`User2 Token1: ${ethers.formatEther(await token1.balanceOf(await user2.getAddress()))}`);
    console.log(`User2 Token2: ${ethers.formatEther(await token2.balanceOf(await user2.getAddress()))}`);
    console.log(`StakingContract Token1: ${ethers.formatEther(await token1.balanceOf(await stakingContract.getAddress()))}`);
    console.log(`StakingContract Token2: ${ethers.formatEther(await token2.balanceOf(await stakingContract.getAddress()))}\n`);
    
    console.log("🔄 Testing staking with different token amounts...");
    const stakeAmount2 = ethers.parseEther("200");
    
    await token1.connect(user1).approve(await stakingContract.getAddress(), stakeAmount2);
    await stakingContract.connect(user1).stake(stakeAmount2);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });