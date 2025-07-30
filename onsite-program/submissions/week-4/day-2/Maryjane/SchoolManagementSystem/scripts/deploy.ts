import { ethers } from "hardhat";

async function main() {

  const SchoolManagementFactory = await ethers.getContractFactory("SchoolManagement");
  const schoolContract = await SchoolManagementFactory.deploy();
  await schoolContract.waitForDeployment();

 
  console.log("SchoolManagement contract deployed to:", await schoolContract.getAddress());
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1;
});
