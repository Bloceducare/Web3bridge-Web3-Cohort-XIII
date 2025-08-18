import { ethers } from "hardhat";

async function main() {
  console.log("Deploying Ludo Game contracts...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance));

  const INITIAL_SUPPLY = 1000000;

  const LudoToken = await ethers.getContractFactory("LudoToken", deployer);
  const ludoToken = await LudoToken.deploy(INITIAL_SUPPLY);
  await ludoToken.waitForDeployment();

  console.log("LudoToken deployed to:", await ludoToken.getAddress());

  const LudoGame = await ethers.getContractFactory("LudoGame", deployer);
  const ludoGame = await LudoGame.deploy(await ludoToken.getAddress());
  await ludoGame.waitForDeployment();

  console.log("LudoGame deployed to:", await ludoGame.getAddress());

  console.log("Deployment completed!");
  console.log("Token Address:", await ludoToken.getAddress());
  console.log("Game Address:", await ludoGame.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
