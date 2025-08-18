import { ethers } from "hardhat";

async function main() {
  console.log("Deploying Ludo Game contracts...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.utils.formatEther(balance), "ETH");

  // Deploy GameToken first
  console.log("\n1. Deploying GameToken...");
  const GameToken = await ethers.getContractFactory("GameToken");
  const initialSupply = 1000000; // 1 million tokens
  const gameToken = await GameToken.deploy(initialSupply);
  await gameToken.deployed();

  const tokenAddress = gameToken.address;
  console.log("GameToken deployed to:", tokenAddress);

  console.log("\n2. Deploying LudoGame...");
  const LudoGame = await ethers.getContractFactory("LudoGame");
  const ludoGame = await LudoGame.deploy(tokenAddress);
  await ludoGame.deployed();

  const gameAddress = ludoGame.address;
  console.log("LudoGame deployed to:", gameAddress);

  console.log("\n3. Minting tokens for testing...");
  const mintAmount = ethers.utils.parseEther("1000");
  await gameToken.mint(deployer.address, mintAmount);
  console.log("Minted 1000 tokens to deployer");

  console.log("\nDeployment Summary");
  console.log("GameToken Address:", tokenAddress);
  console.log("LudoGame Address:", gameAddress);
  console.log("Initial Token Supply:", initialSupply, "tokens");
  console.log("Stake Amount:", "10 tokens");
  console.log("Max Players:", "4");

  console.log("\nNext Steps");
  console.log("1. Verify contracts on block explorer");
  console.log("2. Players need to approve tokens before staking");
  console.log("3. Register players with different colors");
  console.log("4. Stake tokens to start the game");

  return {
    gameToken: tokenAddress,
    ludoGame: gameAddress
  };
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

export default main;
