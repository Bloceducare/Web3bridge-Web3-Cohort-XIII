const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());

  const initialSupply = 1000000;
  const stakeAmount = hre.ethers.parseEther("100");

  console.log("\nDeploying MockERC20 token...");
  const MockERC20 = await hre.ethers.getContractFactory("MockERC20");
  const token = await MockERC20.deploy(initialSupply);
  await token.waitForDeployment();

  console.log("MockERC20 deployed to:", await token.getAddress());

  console.log("\nDeploying LudoGame contract...");
  const LudoGame = await hre.ethers.getContractFactory("LudoGame");
  const ludoGame = await LudoGame.deploy(await token.getAddress(), stakeAmount);
  await ludoGame.waitForDeployment();

  console.log("LudoGame deployed to:", await ludoGame.getAddress());

  console.log("\nDeployment Summary:");
  console.log("==================");
  console.log("MockERC20 Token Address:", await token.getAddress());
  console.log("LudoGame Contract Address:", await ludoGame.getAddress());
  console.log("Stake Amount:", hre.ethers.formatEther(stakeAmount), "LUDO tokens");
  console.log("Initial Token Supply:", initialSupply, "LUDO tokens");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
