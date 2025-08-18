import { ethers } from "hardhat";
import { writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

async function main() {
  console.log("Starting deployment...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  // Deploy LudoToken first
  console.log("\nDeploying LudoToken...");
  const LudoToken = await ethers.getContractFactory("LudoToken");
  const ludoToken = await LudoToken.deploy();
  await ludoToken.waitForDeployment();
  const ludoTokenAddress = await ludoToken.getAddress();
  console.log("LudoToken deployed to:", ludoTokenAddress);

  // Deploy LudoGame
  console.log("\nDeploying LudoGame...");
  const LudoGame = await ethers.getContractFactory("LudoGame");
  const ludoGame = await LudoGame.deploy(ludoTokenAddress);
  await ludoGame.waitForDeployment();
  const ludoGameAddress = await ludoGame.getAddress();
  console.log("LudoGame deployed to:", ludoGameAddress);

  // Verify initial token supply
  const totalSupply = await ludoToken.totalSupply();
  const deployerBalance = await ludoToken.balanceOf(deployer.address);
  console.log("\nToken Details:");
  console.log("Total Supply:", ethers.formatEther(totalSupply), "LUDO");
  console.log("Deployer Balance:", ethers.formatEther(deployerBalance), "LUDO");

  // Test faucet functionality
  console.log("\nTesting faucet...");
  const faucetTx = await ludoToken.faucet();
  await faucetTx.wait();
  const balanceAfterFaucet = await ludoToken.balanceOf(deployer.address);
  console.log("Balance after faucet:", ethers.formatEther(balanceAfterFaucet), "LUDO");

  // Save deployment info
  const deploymentInfo = {
    network: (await ethers.provider.getNetwork()).name,
    chainId: (await ethers.provider.getNetwork()).chainId,
    deployer: deployer.address,
    ludoToken: {
      address: ludoTokenAddress,
      name: "Ludo Token",
      symbol: "LUDO",
      totalSupply: ethers.formatEther(totalSupply)
    },
    ludoGame: {
      address: ludoGameAddress,
      stakeAmount: "10 LUDO"
    },
    deploymentTime: new Date().toISOString()
  };

  // Create deployments directory if it doesn't exist
  const deploymentsDir = join(__dirname, "..", "deployments");
  if (!existsSync(deploymentsDir)) {
    mkdirSync(deploymentsDir, { recursive: true });
  }

  // Write deployment info to file
  const filename = `deployment-${Date.now()}.json`;
  const filepath = join(deploymentsDir, filename);
  writeFileSync(filepath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\nDeployment info saved to: ${filepath}`);

  console.log("\n=== Deployment Summary ===");
  console.log("LudoToken:", ludoTokenAddress);
  console.log("LudoGame:", ludoGameAddress);
  console.log("Network:", deploymentInfo.network);
  console.log("Chain ID:", deploymentInfo.chainId);
  
  // Return addresses for verification script
  return {
    ludoToken: ludoTokenAddress,
    ludoGame: ludoGameAddress
  };
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });