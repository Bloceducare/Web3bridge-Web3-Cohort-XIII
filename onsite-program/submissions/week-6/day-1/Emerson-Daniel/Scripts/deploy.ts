import { ethers } from "hardhat";

async function main() {
  const factory = await ethers.deployContract("PiggyBankFactory");
  await factory.waitForDeployment();
  console.log("PiggyBankFactory deployed to:", await factory.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});