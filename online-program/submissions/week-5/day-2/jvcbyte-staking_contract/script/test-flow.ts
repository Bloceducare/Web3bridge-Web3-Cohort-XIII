// scripts/test-flow.ts
import { ethers } from "hardhat";
import { parseEther, formatEther } from "ethers";
import { time } from "@nomicfoundation/hardhat-toolbox/network-helpers";

async function testCompleteFlow(
    tokenAAddress: string,
    tokenBAddress: string,
    stakingAddress: string
) {
    console.log("🧪 Testing complete staking flow...");

    const [deployer, user1, user2] = await ethers.getSigners();

    const tokenA = await ethers.getContractAt("TokenA", tokenAAddress);
    const tokenB = await ethers.getContractAt("TokenB", tokenBAddress);
    const stakingContract = await ethers.getContractAt("StakingContract", stakingAddress);

    const STAKE_AMOUNT = parseEther("100");
    const LOCK_PERIOD = await stakingContract.lockPeriod();

    console.log("\n1. 🏗️  Setup Phase");

    // Mint tokens to users
    console.log("Minting tokens to test users...");
    await stakingContract.mintTokenA(user1.address, parseEther("1000"));
    await stakingContract.mintTokenA(user2.address, parseEther("1000"));

    const user1Balance = await tokenA.balanceOf(user1.address);
    const user2Balance = await tokenA.balanceOf(user2.address);
    console.log(`✓ User1 TokenA balance: ${formatEther(user1Balance)}`);
    console.log(`✓ User2 TokenA balance: ${formatEther(user2Balance)}`);

    console.log("\n2. 🔒 Staking Phase");

    // User1 stakes tokens
    console.log("User1 staking tokens...");
    await tokenA.connect(user1).transfer(stakingAddress, STAKE_AMOUNT);
    await stakingContract.connect(user1).stake(STAKE_AMOUNT);

    const [user1StakedAmount, user1UnlockTime] = await stakingContract.getStakeInfo(user1.address);
    const user1TokenBBalance = await tokenB.balanceOf(user1.address);

    console.log(`✓ User1 staked: ${formatEther(user1StakedAmount)} TokenA`);
    console.log(`✓ User1 received: ${formatEther(user1TokenBBalance)} TokenB`);
    console.log(`✓ Unlock time: ${new Date(Number(user1UnlockTime) * 1000).toLocaleString()}`);

    // User2 stakes different amount
    console.log("User2 staking tokens...");
    const user2StakeAmount = parseEther("250");
    await tokenA.connect(user2).transfer(stakingAddress, user2StakeAmount);
    await stakingContract.connect(user2).stake(user2StakeAmount);

    const [user2StakedAmount] = await stakingContract.getStakeInfo(user2.address);
    const user2TokenBBalance = await tokenB.balanceOf(user2.address);

    console.log(`✓ User2 staked: ${formatEther(user2StakedAmount)} TokenA`);
    console.log(`✓ User2 received: ${formatEther(user2TokenBBalance)} TokenB`);

    console.log("\n3. 📊 State Verification");

    const totalTokenBSupply = await tokenB.totalSupply();
    const stakingContractTokenABalance = await tokenA.balanceOf(stakingAddress);

    console.log(`✓ Total TokenB supply: ${formatEther(totalTokenBSupply)}`);
    console.log(`✓ Staking contract TokenA balance: ${formatEther(stakingContractTokenABalance)}`);
    console.log(`✓ Expected balance: ${formatEther(STAKE_AMOUNT + user2StakeAmount)}`);

    const balanceMatch = stakingContractTokenABalance === (STAKE_AMOUNT + user2StakeAmount);
    const supplyMatch = totalTokenBSupply === (STAKE_AMOUNT + user2StakeAmount);

    console.log(`✓ Balance verification: ${balanceMatch ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`✓ Supply verification: ${supplyMatch ? '✅ PASS' : '❌ FAIL'}`);

    console.log("\n4. ⏰ Time Lock Testing");

    // Try to unstake before lock period (should fail)
    console.log("Testing early unstake (should fail)...");
    try {
        await stakingContract.connect(user1).unstake(STAKE_AMOUNT);
        console.log("❌ FAIL: Early unstake succeeded when it should have failed");
        return false;
    } catch (error) {
        console.log("✅ PASS: Early unstake correctly rejected");
    }

    // Check time until unlock
    const timeUntilUnlock = await stakingContract.timeUntilUnlock(user1.address);
    console.log(`✓ Time until unlock: ${timeUntilUnlock} seconds`);

    console.log("\n5. ⏭️  Fast Forward Time");

    console.log(`Fast forwarding ${Number(LOCK_PERIOD)} seconds...`);
    await time.increase(Number(LOCK_PERIOD) + 1);

    const isUnlocked = await stakingContract.isUnlocked(user1.address);
    console.log(`✓ User1 tokens unlocked: ${isUnlocked ? '✅ YES' : '❌ NO'}`);

    console.log("\n6. 🔓 Unstaking Phase");

    // User1 unstakes
    console.log("User1 unstaking...");
    const user1TokenABeforeUnstake = await tokenA.balanceOf(user1.address);
    const user1TokenBBeforeUnstake = await tokenB.balanceOf(user1.address);

    await stakingContract.connect(user1).unstake(STAKE_AMOUNT);

    const user1TokenAAfterUnstake = await tokenA.balanceOf(user1.address);
    const user1TokenBAfterUnstake = await tokenB.balanceOf(user1.address);

    console.log(`✓ User1 TokenA: ${formatEther(user1TokenABeforeUnstake)} → ${formatEther(user1TokenAAfterUnstake)}`);
    console.log(`✓ User1 TokenB: ${formatEther(user1TokenBBeforeUnstake)} → ${formatEther(user1TokenBAfterUnstake)}`);

    const tokenARestored = user1TokenAAfterUnstake === user1TokenABeforeUnstake + STAKE_AMOUNT;
    const tokenBBurned = user1TokenBAfterUnstake === user1TokenBBeforeUnstake - STAKE_AMOUNT;

    console.log(`✓ TokenA restored: ${tokenARestored ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`✓ TokenB burned: ${tokenBBurned ? '✅ PASS' : '❌ FAIL'}`);

    // Check stake info is reset
    const [finalStakedAmount, finalUnlockTime] = await stakingContract.getStakeInfo(user1.address);
    const stakeReset = finalStakedAmount === 0n && finalUnlockTime === 0n;
    console.log(`✓ Stake info reset: ${stakeReset ? '✅ PASS' : '❌ FAIL'}`);

    console.log("\n7. 🧮 Final State Verification");

    const finalTokenBSupply = await tokenB.totalSupply();
    const finalStakingBalance = await tokenA.balanceOf(stakingAddress);

    console.log(`✓ Final TokenB supply: ${formatEther(finalTokenBSupply)}`);
    console.log(`✓ Final staking balance: ${formatEther(finalStakingBalance)}`);

    // Only User2's stake should remain
    const expectedFinalSupply = user2StakeAmount;
    const finalSupplyCorrect = finalTokenBSupply === expectedFinalSupply;
    const finalBalanceCorrect = finalStakingBalance === expectedFinalSupply;

    console.log(`✓ Final supply correct: ${finalSupplyCorrect ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`✓ Final balance correct: ${finalBalanceCorrect ? '✅ PASS' : '❌ FAIL'}`);

    console.log("\n8. 🔄 Additional Scenarios");

    // Test partial unstake
    console.log("Testing partial unstake...");
    const partialAmount = parseEther("100");
    await stakingContract.connect(user2).unstake(partialAmount);

    const [user2RemainingStake] = await stakingContract.getStakeInfo(user2.address);
    const expectedRemaining = user2StakeAmount - partialAmount;
    const partialUnstakeCorrect = user2RemainingStake === expectedRemaining;

    console.log(`✓ Partial unstake: ${partialUnstakeCorrect ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`✓ Remaining stake: ${formatEther(user2RemainingStake)}`);

    // Test TokenB transfers
    console.log("Testing TokenB transfers...");
    const user2FinalTokenB = await tokenB.balanceOf(user2.address);
    const transferAmount = parseEther("50");

    await tokenB.connect(user2).transfer(user1.address, transferAmount);

    const user1FinalTokenB = await tokenB.balanceOf(user1.address);
    const user2AfterTransferTokenB = await tokenB.balanceOf(user2.address);

    const transferCorrect =
        user1FinalTokenB === transferAmount &&
        user2AfterTransferTokenB === user2FinalTokenB - transferAmount;

    console.log(`✓ TokenB transfer: ${transferCorrect ? '✅ PASS' : '❌ FAIL'}`);

    console.log("\n🎯 Flow Test Summary");
    console.log("=".repeat(50));

    const allChecks = [
        balanceMatch,
        supplyMatch,
        tokenARestored,
        tokenBBurned,
        stakeReset,
        finalSupplyCorrect,
        finalBalanceCorrect,
        partialUnstakeCorrect,
        transferCorrect
    ];

    const passCount = allChecks.filter(check => check).length;
    const totalChecks = allChecks.length;

    console.log(`✓ Checks passed: ${passCount}/${totalChecks}`);

    if (passCount === totalChecks) {
        console.log("🎉 ALL TESTS PASSED! Staking flow working correctly.");
        return true;
    } else {
        console.log("⚠️  SOME TESTS FAILED! Please review the implementation.");
        return false;
    }
}

// Export for use in other scripts
export { testCompleteFlow };

// If run directly
if (require.main === module) {
    const args = process.argv.slice(2);
    if (args.length !== 3) {
        console.log("Usage: npx hardhat run scripts/test-flow.ts -- <tokenA> <tokenB> <staking>");
        process.exit(1);
    }

    testCompleteFlow(args[0], args[1], args[2])
        .then((success) => process.exit(success ? 0 : 1))
        .catch((error) => {
            console.error("Flow test failed:", error);
            process.exit(1);
        });
}