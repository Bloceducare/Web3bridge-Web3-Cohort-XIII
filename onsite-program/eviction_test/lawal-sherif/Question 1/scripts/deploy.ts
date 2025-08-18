import { ethers } from "hardhat";

async function main() {
  console.log("Starting deployment...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");
  
  const network = await ethers.provider.getNetwork();
  console.log("Network:", network.name, "Chain ID:", network.chainId);
  
  const Lottery = await ethers.getContractFactory("Lottery");
  console.log("Deploying Lottery contract...");
  
  const lottery = await Lottery.deploy();
  console.log("Transaction hash:", lottery.deploymentTransaction()?.hash);
  
  await lottery.waitForDeployment();
  const address = await lottery.getAddress();
  
  console.log("✅ Contract deployed at:", address);
  console.log("🔗 View on explorer:", `https://sepolia-blockscout.lisk.com/address/${address}`);
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});