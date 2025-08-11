const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const PiggyBankFactory = await ethers.getContractFactory("PiggyBankFactory");
  const factory = await PiggyBankFactory.deploy();
  await factory.waitForDeployment(); // Replace deployed() with waitForDeployment()

  console.log("PiggyBankFactory deployed to:", await factory.getAddress()); // Use getAddress() to get the deployed address
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

// Deployed contracts: 0x45d8C24352c48644539Ed8B276CE70234a2CD17d