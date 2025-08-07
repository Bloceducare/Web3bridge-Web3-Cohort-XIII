
// import { ethers } from "hardhat";
// import { config as dotenvConfig } from "dotenv";

// dotenvConfig();

// async function main() {
//   // Ensure private key is available
//   const walletkey = process.env.WALLET_KEY;
//   if (!walletkey) {
//     throw new Error("WALLET_KEY not set in .env file");
//   }

//   // Get the contract factory
//   const SchoolManagement = await ethers.getContractFactory("SchoolManagement");

//   // Deploy the contract
//   console.log("Deploying SchoolManagement to Lisk Sepolia testnet...");
//   const school = await SchoolManagement.deploy();

//   // Wait for deployment to complete
//   await school.waitForDeployment();

//   // Log the deployed contract address
//   console.log("SchoolManagement deployed to:", await school.getAddress());
// }

// main()
//   .then(() => process.exit(0))
//   .catch((error) => {
//     console.error(error);
//     process.exit(1);
//   });


import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";


const SchoolManagementModule = buildModule("SchoolManagementModule", (m) => {

  const schoolManagement = m.contract("SchoolManagement",);

  return { schoolManagement };
});

export default SchoolManagementModule;
