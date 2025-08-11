// scripts/deploy.ts
import { ethers } from "hardhat";
import { parseEther } from "ethers";

async function main() {
    console.log("Starting deployment...");

    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with account:", deployer.address);
    console.log("Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)));

    const LOCK_PERIOD = 7 * 24 * 60 * 60; // 7 days

    // Deploy TokenA
    console.log("\n1. Deploying TokenA...");
    const TokenA = await ethers.getContractFactory("TokenA");
    const tokenA = await TokenA.deploy();
    await tokenA.waitForDeployment();
    const tokenAAddress = await tokenA.getAddress();
    console.log("TokenA deployed to:", tokenAAddress);

    // Deploy TokenB
    console.log("\n2. Deploying TokenB...");
    const TokenB = await ethers.getContractFactory("TokenB");
    const tokenB = await TokenB.deploy();
    await tokenB.waitForDeployment();
    const tokenBAddress = await tokenB.getAddress();
    console.log("TokenB deployed to:", tokenBAddress);

    // Deploy StakingContract
    console.log("\n3. Deploying StakingContract...");
    const StakingContract = await ethers.getContractFactory("StakingContract");
    const stakingContract = await StakingContract.deploy(
        tokenAAddress,
        tokenBAddress,
        LOCK_PERIOD
    );
    await stakingContract.waitForDeployment();
    const stakingAddress = await stakingContract.getAddress();
    console.log("StakingContract deployed to:", stakingAddress);

    // Set up contract relationships
    console.log("\n4. Setting up contract relationships...");

    console.log("Initializing staking contract...");
    const initTx = await stakingContract._setStakingContract();
    await initTx.wait();
    console.log("✓ Staking contract initialized");

    // Verify deployment
    console.log("\n5. Verifying deployment...");

    const tokenAStakingContract = await tokenA.stakingContract();
    const tokenBStakingContract = await tokenB.stakingContract();
    const stakingTokenA = await stakingContract.tokenA();
    const stakingTokenB = await stakingContract.tokenB();
    const lockPeriod = await stakingContract.lockPeriod();

    console.log("Verification results:");
    console.log("- TokenA staking contract:", tokenAStakingContract);
    console.log("- TokenB staking contract:", tokenBStakingContract);
    console.log("- Staking TokenA address:", stakingTokenA);
    console.log("- Staking TokenB address:", stakingTokenB);
    console.log("- Lock period:", lockPeriod.toString(), "seconds");

    const isValid =
        tokenAStakingContract === stakingAddress &&
        tokenBStakingContract === stakingAddress &&
        stakingTokenA === tokenAAddress &&
        stakingTokenB === tokenBAddress &&
        lockPeriod === BigInt(LOCK_PERIOD);

    if (isValid) {
        console.log("✅ All contracts deployed and configured correctly!");
    } else {
        console.log("❌ Contract configuration verification failed!");
        return;
    }

    // Optional: Mint some initial tokens for testing
    if (process.env.MINT_INITIAL_TOKENS === "true") {
        console.log("\n6. Minting initial tokens for testing...");
        const testUsers = [
            "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", // Hardhat test account 1
            "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", // Hardhat test account 2
        ];

        for (const user of testUsers) {
            const mintTx = await stakingContract.mintTokenA(user, parseEther("1000"));
            await mintTx.wait();
            console.log(`✓ Minted 1000 TokenA to ${user}`);
        }
    }

    console.log("\n🎉 Deployment completed successfully!");

    // Output deployment info for scripts
    console.log("\n📋 Deployment Summary:");
    console.log("=".repeat(50));
    console.log(`TokenA: ${tokenAAddress}`);
    console.log(`TokenB: ${tokenBAddress}`);
    console.log(`StakingContract: ${stakingAddress}`);
    console.log(`Lock Period: ${LOCK_PERIOD} seconds (${LOCK_PERIOD / (24 * 60 * 60)} days)`);
    console.log("=".repeat(50));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Deployment failed:", error);
        process.exit(1);
    });




