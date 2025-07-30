import { ethers } from "hardhat";

async function main() {
  const SchoolManagement = await ethers.getContractFactory("SchoolManagement");
  const schoolManagement = await SchoolManagement.deploy();

  await schoolManagement.waitForDeployment();
  console.log("SchoolManagement deployed to:", schoolManagement.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});