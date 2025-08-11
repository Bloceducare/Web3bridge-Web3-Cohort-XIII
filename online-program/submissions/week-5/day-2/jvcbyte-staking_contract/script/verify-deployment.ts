// scripts/verify-deployment.ts
import { ethers } from "hardhat";
import { parseEther } from "ethers";

async function verifyDeployment(
    tokenAAddress: string,
    tokenBAddress: string,
    stakingAddress: string
) {
    console.log("🔍 Verifying deployment integrity...");

    const tokenA = await ethers.getContractAt("TokenA", tokenAAddress);
    const tokenB = await ethers.getContractAt("TokenB", tokenBAddress);
    const stakingContract = await ethers.getContractAt("StakingContract", stakingAddress);

    const checks = [];

    // Basic contract checks
    try {
        const tokenAName = await tokenA.name();
        const tokenBName = await tokenB.name();
        checks.push({ name: "TokenA name", value: tokenAName, expected: "Token A", pass: tokenAName === "Token A" });
        checks.push({ name: "TokenB name", value: tokenBName, expected: "Token B", pass: tokenBName === "Token B" });
    } catch (error) {
        checks.push({ name: "Basic contract calls", value: "FAILED", expected: "SUCCESS", pass: false, error });
    }

    // Relationship checks
    try {
        const tokenAStaking = await tokenA.stakingContract();
        const tokenBStaking = await tokenB.stakingContract();
        const stakingTokenA = await stakingContract.tokenA();
        const stakingTokenB = await stakingContract.tokenB();

        checks.push({
            name: "TokenA → Staking relationship",
            value: tokenAStaking,
            expected: stakingAddress,
            pass: tokenAStaking === stakingAddress
        });
        checks.push({
            name: "TokenB → Staking relationship",
            value: tokenBStaking,
            expected: stakingAddress,
            pass: tokenBStaking === stakingAddress
        });
        checks.push({
            name: "Staking → TokenA relationship",
            value: stakingTokenA,
            expected: tokenAAddress,
            pass: stakingTokenA === tokenAAddress
        });
        checks.push({
            name: "Staking → TokenB relationship",
            value: stakingTokenB,
            expected: tokenBAddress,
            pass: stakingTokenB === tokenBAddress
        });
    } catch (error) {
        checks.push({ name: "Contract relationships", value: "FAILED", expected: "SUCCESS", pass: false, error });
    }

    // Access control checks
    try {
        const [signer] = await ethers.getSigners();

        // This should fail (access control working)
        try {
            await tokenA.connect(signer).mint(signer.address, parseEther("1"));
            checks.push({ name: "TokenA access control", value: "FAILED", expected: "PROTECTED", pass: false });
        } catch {
            checks.push({ name: "TokenA access control", value: "PROTECTED", expected: "PROTECTED", pass: true });
        }

        try {
            await tokenB.connect(signer).mint(signer.address, parseEther("1"));
            checks.push({ name: "TokenB access control", value: "FAILED", expected: "PROTECTED", pass: false });
        } catch {
            checks.push({ name: "TokenB access control", value: "PROTECTED", expected: "PROTECTED", pass: true });
        }
    } catch (error) {
        checks.push({ name: "Access control tests", value: "ERROR", expected: "SUCCESS", pass: false, error });
    }

    // Print results
    console.log("\n📊 Verification Results:");
    console.log("=".repeat(80));

    let allPassed = true;
    for (const check of checks) {
        const status = check.pass ? "✅ PASS" : "❌ FAIL";
        console.log(`${status} | ${check.name.padEnd(30)} | ${check.value}`);
        if (!check.pass) {
            allPassed = false;
            if (check.error) {
                console.log(`     Error: ${check.error}`);
            }
        }
    }

    console.log("=".repeat(80));

    if (allPassed) {
        console.log("🎉 All verification checks passed!");
        return true;
    } else {
        console.log("⚠️  Some verification checks failed!");
        return false;
    }
}

// Export for use in other scripts
export { verifyDeployment };

// If run directly
if (require.main === module) {
    const args = process.argv.slice(2);
    if (args.length !== 3) {
        console.log("Usage: npx hardhat run scripts/verify-deployment.ts -- <tokenA> <tokenB> <staking>");
        process.exit(1);
    }

    verifyDeployment(args[0], args[1], args[2])
        .then((success) => process.exit(success ? 0 : 1))
        .catch((error) => {
            console.error("Verification failed:", error);
            process.exit(1);
        });
}