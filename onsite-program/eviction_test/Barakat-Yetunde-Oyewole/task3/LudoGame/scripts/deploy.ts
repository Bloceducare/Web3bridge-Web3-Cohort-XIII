import { ethers } from "hardhat";

async function main() {
  console.log("Deploying LudoToken and LudoGame contracts...");

  // Deploy LudoToken
  const LudoToken = await ethers.getContractFactory("LudoToken");
  const ludoToken = await LudoToken.deploy();
  await ludoToken.waitForDeployment();
  
  console.log("LudoToken deployed to:", await ludoToken.getAddress());

  // Deploy LudoGame
  const LudoGame = await ethers.getContractFactory("LudoGame");
  const ludoGame = await LudoGame.deploy(await ludoToken.getAddress());
  await ludoGame.waitForDeployment();
  
  console.log("LudoGame deployed to:", await ludoGame.getAddress());
  
  // Mint some tokens for testing
  const [deployer] = await ethers.getSigners();
  await ludoToken.mint(deployer.address, ethers.parseEther("10000"));
  
  console.log("Deployment completed!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});