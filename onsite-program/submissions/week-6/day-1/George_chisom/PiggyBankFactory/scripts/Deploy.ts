import { ethers } from "hardhat";
import { Contract, Signer } from "ethers";

async function main() {
  const [deployer]: Signer[] = await ethers.getSigners();

  const deployerAddress = await deployer.getAddress();

  console.log("Deploying contracts with:", deployerAddress);

  // Deploy ChildFactory
  const ChildFactory = await ethers.getContractFactory("ChildFactory");

  const childFactory = await ChildFactory.deploy();

  console.log("ChildFactory deployed to:", childFactory);

  // Deploy a PiggyBank via ChildFactory
  const tx = await childFactory.createPiggyBank();

  const receipt = await tx.wait();

  console.log("PiggyBank deployed to:", receipt);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
