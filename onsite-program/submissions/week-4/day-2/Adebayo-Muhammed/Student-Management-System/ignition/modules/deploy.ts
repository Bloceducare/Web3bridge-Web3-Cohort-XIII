import { ethers } from "hardhat";

async function main() {
  console.log("Deploying SchoolManagement...");
  
  const SchoolManagement = await ethers.getContractFactory("SchoolManagement");
  const contract = await SchoolManagement.deploy();
  
  await contract.waitForDeployment();
  
  console.log("Contract deployed to:", await contract.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});