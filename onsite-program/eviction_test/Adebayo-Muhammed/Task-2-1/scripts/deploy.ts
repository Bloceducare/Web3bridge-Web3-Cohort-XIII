import { ethers } from "hardhat";

async function main() {
  console.log("🎲 Deploying Ludo Game Contracts...\n");
  
  const [deployer] = await ethers.getSigners();
  
  console.log("📋 Deployment Details:");
  console.log(`Deployer address: ${deployer.address}`);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Deployer balance: ${ethers.formatEther(balance)} ETH\n`);
  
  // Deploy LudoToken first
  console.log("📦 Deploying LudoToken contract...");
  const LudoTokenFactory = await ethers.getContractFactory("LudoToken");
  const ludoToken = await LudoTokenFactory.deploy(1000000); // 1M tokens
  
  await ludoToken.waitForDeployment();
  const tokenAddress = await ludoToken.getAddress();
  
  console.log(`✅ LudoToken deployed to: ${tokenAddress}`);
  
  // Deploy LudoGame
  console.log("\n📦 Deploying LudoGame contract...");
  const LudoGameFactory = await ethers.getContractFactory("LudoGame");
  const ludoGame = await LudoGameFactory.deploy(tokenAddress);
  
  await ludoGame.waitForDeployment();
  const gameAddress = await ludoGame.getAddress();
  
  console.log(`✅ LudoGame deployed to: ${gameAddress}`);
  
  // Display contract information
  console.log("\n📋 Contract Information:");
  console.log(`Token Name: ${await ludoToken.name()}`);
  console.log(`Token Symbol: ${await ludoToken.symbol()}`);
  console.log(`Total Supply: ${ethers.formatEther(await ludoToken.totalSupply())} LUDO`);
  console.log(`Stake Amount: ${ethers.formatEther(await ludoGame.STAKE_AMOUNT())} LUDO`);
  console.log(`Board Size: ${await ludoGame.BOARD_SIZE()}`);
  
  // Mint some tokens to test accounts for demo
  console.log("\n🪙 Minting tokens to test accounts...");
  const [, player1, player2, player3, player4] = await ethers.getSigners();
  
  const testAccounts = [player1, player2, player3, player4];
  for (let i = 0; i < testAccounts.length; i++) {
    await ludoToken.mint(testAccounts[i].address, ethers.parseEther("1000"));
    console.log(`✅ Minted 1000 LUDO to ${testAccounts[i].address}`);
  }
  
  console.log("\n🎉 Deployment Complete!");
  console.log("\n📋 Contract Addresses:");
  console.log(`LudoToken: ${tokenAddress}`);
  console.log(`LudoGame: ${gameAddress}`);
  
  return {
    ludoToken: tokenAddress,
    ludoGame: gameAddress
  };
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
