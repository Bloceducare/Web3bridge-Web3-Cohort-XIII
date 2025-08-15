// scripts/full-deployment-test.ts
import { ethers } from "hardhat";
import { verifyDeployment } from "./verify-deployment";
import { testCompleteFlow } from "./test-flow";

async function fullDeploymentTest() {
    console.log("🚀 Starting full deployment and testing pipeline...");

    const LOCK_PERIOD = 7 * 24 * 60 * 60; // 7 days

    try {
        // 1. Deploy contracts
        console.log("\n📦 Phase 1: Deployment");
        const [deployer] = await ethers.getSigners();

        const TokenA = await ethers.getContractFactory("TokenA");
        const TokenB = await ethers.getContractFactory("TokenB");
        const StakingContract = await ethers.getContractFactory("StakingContract");

        const tokenA = await TokenA.deploy();
        await tokenA.waitForDeployment();

        const tokenB = await TokenB.deploy();
        await tokenB.waitForDeployment();

        const stakingContract = await StakingContract.deploy(
            await tokenA.getAddress(),
            await tokenB.getAddress(),
            LOCK_PERIOD
        );
        await stakingContract.waitForDeployment();

        // Setup relationships
        await stakingContract._setStakingContract();

        const addresses = {
            tokenA: await tokenA.getAddress(),
            tokenB: await tokenB.getAddress(),
            staking: await stakingContract.getAddress()
        };

        console.log("✅ Deployment completed");
        console.log(`TokenA: ${addresses.tokenA}`);
        console.log(`TokenB: ${addresses.tokenB}`);
        console.log(`Staking: ${addresses.staking}`);

        // 2. Verify deployment
        console.log("\n🔍 Phase 2: Verification");
        const verificationSuccess = await verifyDeployment(
            addresses.tokenA,
            addresses.tokenB,
            addresses.staking
        );

        if (!verificationSuccess) {
            console.log("❌ Verification failed, aborting test");
            return false;
        }

        // 3. Test complete flow
        console.log("\n🧪 Phase 3: Flow Testing");
        const flowTestSuccess = await testCompleteFlow(
            addresses.tokenA,
            addresses.tokenB,
            addresses.staking
        );

        if (!flowTestSuccess) {
            console.log("❌ Flow test failed");
            return false;
        }

        console.log("\n🎊 ALL PHASES COMPLETED SUCCESSFULLY!");
        console.log("The staking system is fully functional and ready for mainnet deployment.");

        return true;

    } catch (error) {
        console.error("💥 Pipeline failed:", error);
        return false;
    }
}

// Run if called directly
if (require.main === module) {
    fullDeploymentTest()
        .then((success) => process.exit(success ? 0 : 1))
        .catch((error) => {
            console.error("Pipeline execution failed:", error);
            process.exit(1);
        });
}