import { ethers, run } from "hardhat";

async function main() {
  console.log("Deploying Piggybank factory contract to Lisk Sepolia...");

  const PiggyBankFactory = await ethers.getContractFactory("PiggyBankFactory");
  const piggybankFactory = await PiggyBankFactory.deploy();
  await piggybankFactory.waitForDeployment();

  const contractAddress = await piggybankFactory.getAddress();
  console.log("PiggyBankFactory contract deployed to:", contractAddress);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
