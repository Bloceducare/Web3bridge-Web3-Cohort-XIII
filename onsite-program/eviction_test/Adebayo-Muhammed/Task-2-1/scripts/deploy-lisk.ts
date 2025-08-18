import { ethers } from "hardhat";
import hre from "hardhat";

async function main() {
  console.log("Deploying Ludo Game Contracts to Lisk Sepolia Testnet...\n");
  
  const [deployer] = await ethers.getSigners();
  
  console.log("Deployment Details:");
  console.log(`Deployer address: ${deployer.address}`);
  console.log(`Network: Lisk Sepolia Testnet (Chain ID: 4202)`);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Deployer balance: ${ethers.formatEther(balance)} ETH\n`);
  
  if (balance === 0n) {
    console.log("Error: Deployer has no ETH balance!");
    console.log("Please fund your account with Lisk Sepolia testnet ETH");
    console.log("You can get testnet ETH from: https://sepolia-faucet.lisk.com/");
    return;
  }
  
  console.log("Deploying LudoToken contract...");
  const LudoTokenFactory = await ethers.getContractFactory("LudoToken");
  const ludoToken = await LudoTokenFactory.deploy(1000000);
  
  console.log("Waiting for LudoToken deployment confirmation...");
  await ludoToken.waitForDeployment();
  
  const tokenAddress = await ludoToken.getAddress();
  console.log(`LudoToken deployed to: ${tokenAddress}`);
  
  console.log("\nDeploying LudoGame contract...");
  const LudoGameFactory = await ethers.getContractFactory("LudoGame");
  const ludoGame = await LudoGameFactory.deploy(tokenAddress);
  
  console.log("Waiting for LudoGame deployment confirmation...");
  await ludoGame.waitForDeployment();
  
  const gameAddress = await ludoGame.getAddress();
  console.log(`LudoGame deployed to: ${gameAddress}`);
  
  console.log("\nContract Details:");
  console.log(`Token Name: ${await ludoToken.name()}`);
  console.log(`Token Symbol: ${await ludoToken.symbol()}`);
  console.log(`Total Supply: ${ethers.formatEther(await ludoToken.totalSupply())} LUDO`);
  
  console.log("\nVerifying contracts on Lisk Explorer...");
  
  try {
    await new Promise(resolve => setTimeout(resolve, 30000));
    
    await hre.run("verify:verify", {
      address: tokenAddress,
      constructorArguments: [1000000],
    });
    
    console.log("LudoToken verified successfully!");
  } catch (error) {
    console.log("LudoToken verification failed. You can verify manually later.");
  }
  
  try {
    await hre.run("verify:verify", {
      address: gameAddress,
      constructorArguments: [tokenAddress],
    });
    
    console.log("LudoGame verified successfully!");
  } catch (error) {
    console.log("LudoGame verification failed. You can verify manually later.");
  }
  
  console.log("\nDeployment Complete!");
  console.log(`\nContract Addresses:`);
  console.log(`LudoToken: ${tokenAddress}`);
  console.log(`LudoGame: ${gameAddress}`);
  console.log(`\nView on Lisk Explorer:`);
  console.log(`LudoToken: https://sepolia-blockscout.lisk.com/address/${tokenAddress}`);
  console.log(`LudoGame: https://sepolia-blockscout.lisk.com/address/${gameAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
