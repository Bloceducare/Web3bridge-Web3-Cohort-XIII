import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  const initialSupply = ethers.parseEther("1000000");
  const TestToken = await ethers.getContractFactory("TestToken");
  const testToken = await TestToken.deploy(initialSupply);
  await testToken.waitForDeployment();

  console.log("TestToken deployed to:", await testToken.getAddress());

  const PiggyBank = await ethers.getContractFactory("PiggyBank");
  const piggyBank = await PiggyBank.deploy();
  await piggyBank.waitForDeployment();

  console.log("PiggyBank deployed to:", await piggyBank.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
