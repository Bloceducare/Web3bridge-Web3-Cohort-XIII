import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  const LudoGame = await ethers.getContractFactory("LudoGame");
  const ludoGame = await LudoGame.deploy();

  await ludoGame.waitForDeployment();

  console.log("LudoGame deployed to:", await ludoGame.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });