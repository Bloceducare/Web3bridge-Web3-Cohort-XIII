import { ethers } from "hardhat";
import hre from "hardhat";

async function main() {
  console.log("🚀 Deploying Lottery Contract to Lisk Sepolia Testnet...\n");
  
  const [deployer] = await ethers.getSigners();
  
  console.log("📋 Deployment Details:");
  console.log(`Deployer address: ${deployer.address}`);
  console.log(`Network: Lisk Sepolia Testnet (Chain ID: 4202)`);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Deployer balance: ${ethers.formatEther(balance)} ETH\n`);
  
  if (balance === 0n) {
    console.log("❌ Error: Deployer has no ETH balance!");
    console.log("Please fund your account with Lisk Sepolia testnet ETH");
    console.log("You can get testnet ETH from: https://sepolia-faucet.lisk.com/");
    return;
  }
  
  console.log("📦 Deploying Lottery contract...");
  
  const LotteryFactory = await ethers.getContractFactory("Lottery");
  const lottery = await LotteryFactory.deploy();
  
  console.log("⏳ Waiting for deployment confirmation...");
  await lottery.waitForDeployment();
  
  const contractAddress = await lottery.getAddress();
  
  console.log("\n✅ Deployment Successful!");
  console.log(`📍 Contract Address: ${contractAddress}`);
  console.log(`🔗 View on Lisk Explorer: https://sepolia-blockscout.lisk.com/address/${contractAddress}`);
  
  console.log("\n📋 Contract Details:");
  console.log(`Entry Fee: ${ethers.formatEther(await lottery.ENTRY_FEE())} ETH`);
  console.log(`Max Players: ${await lottery.MAX_PLAYERS()}`);
  console.log(`Current Round: ${await lottery.getCurrentRound()}`);
  
  console.log("\n🔍 Verifying contract on Lisk Explorer...");
  
  try {
    await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30 seconds
    
    await hre.run("verify:verify", {
      address: contractAddress,
      constructorArguments: [],
    });
    
    console.log("✅ Contract verified successfully!");
  } catch (error) {
    console.log("⚠️  Verification failed. You can verify manually later.");
    console.log("Error:", error);
  }
  
  console.log("\n🎉 Deployment Complete!");
  console.log(`\n📋 Add this to your README.md:`);
  console.log(`**Lisk Sepolia Testnet**: \`${contractAddress}\``);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
