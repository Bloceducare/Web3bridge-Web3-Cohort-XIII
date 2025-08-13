import { ethers } from "hardhat";

async function main() {
    console.log("🔍 Verifying contracts on Lisk Sepolia Block Explorer...\n");
    
    const token1Address = "0x6B645c9fa79150fF39209B05731991115d1b3661";
    const token2Address = "0x347012F6B90CA2A925111eDfA06Db745507a425A";
    const stakingContractAddress = "0x2CF8CBDA7568dE6045d091D1461dA9401c537fd2";
    
    console.log("📋 Contract Addresses to verify:");
    console.log(`Token1: ${token1Address}`);
    console.log(`Token2: ${token2Address}`);
    console.log(`StakingContract: ${stakingContractAddress}\n`);
    
    try {
        console.log("🔍 Verifying Token1...");
        await hre.run("verify:verify", {
            address: token1Address,
            constructorArguments: [],
        });
        console.log("✅ Token1 verified successfully!");
        
        console.log("🔍 Verifying Token2...");
        await hre.run("verify:verify", {
            address: token2Address,
            constructorArguments: [],
        });
        console.log("✅ Token2 verified successfully!");
        
        console.log("🔍 Verifying StakingContract...");
        const lockPeriod = 7 * 24 * 60 * 60; // 7 days
        await hre.run("verify:verify", {
            address: stakingContractAddress,
            constructorArguments: [token1Address, token2Address, lockPeriod],
        });
        console.log("✅ StakingContract verified successfully!");
        
        console.log("\n🎉 All contracts verified successfully!");
        console.log("\n🔗 View contracts on Lisk Sepolia Block Explorer:");
        console.log(`Token1: https://sepolia-blockscout.lisk.com/address/${token1Address}`);
        console.log(`Token2: https://sepolia-blockscout.lisk.com/address/${token2Address}`);
        console.log(`StakingContract: https://sepolia-blockscout.lisk.com/address/${stakingContractAddress}`);
        
    } catch (error) {
        console.error("❌ Verification failed:", error);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Script failed:", error);
        process.exit(1);
    }); 