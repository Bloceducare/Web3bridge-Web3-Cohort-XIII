const { ethers, run, network } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", await deployer.getAddress());

  const initialSupply = ethers.parseUnits("1000000", 18);

  const LudoToken = await ethers.getContractFactory("LudoToken");
  const token = await LudoToken.deploy(initialSupply);
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("LudoToken deployed at:", tokenAddress);

  const winningScore = Number(process.env.WINNING_SCORE || 20);

  const LudoGame = await ethers.getContractFactory("LudoGame");
  const game = await LudoGame.deploy(tokenAddress, winningScore);
  await game.waitForDeployment();
  const gameAddress = await game.getAddress();
  console.log("LudoGame deployed at:", gameAddress);

  if (network.name !== "hardhat" && process.env.ETHERSCAN_API_KEY) {
    console.log("Verifying contracts...");
    try {
      await run("verify:verify", {
        address: tokenAddress,
        constructorArguments: [initialSupply]
      });
    } catch (e) {
      console.log("Token verification skipped:", e.message || e);
    }
    try {
      await run("verify:verify", {
        address: gameAddress,
        constructorArguments: [tokenAddress, winningScore]
      });
    } catch (e) {
      console.log("Game verification skipped:", e.message || e);
    }
  }
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
}); 