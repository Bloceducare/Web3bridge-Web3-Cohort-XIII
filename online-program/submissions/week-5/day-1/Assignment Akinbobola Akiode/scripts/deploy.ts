import { ethers } from "hardhat";

async function main() {
    console.log("🚀 Deploying contracts to Lisk Sepolia...\n");
    
    const [deployer] = await ethers.getSigners();
    const ownerAddress = "0x838Abf92E994e088e641399e91AcE43514038b90";
    
    console.log(`Deployer: ${await deployer.getAddress()}`);
    console.log(`Owner: ${ownerAddress}\n`);
    
    console.log("📦 Deploying Token1...");
    const Token1 = await ethers.getContractFactory("Token1");
    const token1 = await Token1.deploy();
    await token1.waitForDeployment();
    const token1Address = await token1.getAddress();
    console.log(`Token1 deployed to: ${token1Address}`);
    
    console.log("📦 Deploying Token2...");
    const Token2 = await ethers.getContractFactory("Token2");
    const token2 = await Token2.deploy();
    await token2.waitForDeployment();
    const token2Address = await token2.getAddress();
    console.log(`Token2 deployed to: ${token2Address}`);
    
    console.log("📦 Deploying StakingContract...");
    const StakingContract = await ethers.getContractFactory("StakingContract");
    const lockPeriod = 7 * 24 * 60 * 60; // 7 days
    const stakingContract = await StakingContract.deploy(
        token1Address,
        token2Address,
        lockPeriod
    );
    await stakingContract.waitForDeployment();
    const stakingContractAddress = await stakingContract.getAddress();
    console.log(`StakingContract deployed to: ${stakingContractAddress}`);
    console.log(`Lock period: ${lockPeriod} seconds (7 days)\n`);
    
    console.log("✅ Deployment completed successfully!");
    console.log("\n📋 Contract Addresses:");
    console.log(`Token1: ${token1Address}`);
    console.log(`Token2: ${token2Address}`);
    console.log(`StakingContract: ${stakingContractAddress}`);
    console.log(`Owner: ${ownerAddress}\n`);
    
    console.log("🔗 Verify contracts on Lisk Sepolia Block Explorer:");
    console.log(`https://sepolia-blockscout.lisk.com/address/${token1Address}`);
    console.log(`https://sepolia-blockscout.lisk.com/address/${token2Address}`);
    console.log(`https://sepolia-blockscout.lisk.com/address/${stakingContractAddress}\n`);
    
    console.log("💰 Initial Token1 supply: 1,000,000 tokens");
    console.log("💰 Initial Token2 supply: 0 tokens (minted when staking)");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    }); 