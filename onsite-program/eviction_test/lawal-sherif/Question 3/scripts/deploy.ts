import { ethers } from "hardhat";

async function main() {
  console.log("🎲 Starting Ludo + LudoToken deployment...");

  const [deployer] = await ethers.getSigners();
  console.log("📋 Deploying with account:", deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH");

  // 1️⃣ Deploy LudoToken (1,000,000 supply)
  const Token = await ethers.getContractFactory("LudoToken");
  const token = await Token.deploy(1_000_000);
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("🪙 LudoToken deployed to:", tokenAddress);

  // 2️⃣ Deploy Ludo with token address
  const Ludo = await ethers.getContractFactory("Ludo");
  const ludo = await Ludo.deploy(tokenAddress);
  await ludo.waitForDeployment();
  const ludoAddress = await ludo.getAddress();
  console.log("🎮 Ludo deployed to:", ludoAddress);

  console.log("\n✅ Deployment successful!");
  console.log("   Token Address:", tokenAddress);
  console.log("   Ludo Address :", ludoAddress);
}

// Run the script
main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});
