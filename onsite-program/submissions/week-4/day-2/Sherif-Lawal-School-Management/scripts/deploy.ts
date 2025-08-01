import { ethers } from "hardhat";

async function main() {
  console.log("Deploying StudentManagementSystem to Lisk Sepolia...");

  // Get the contract factory
  const StudentManagementSystem = await ethers.getContractFactory(
    "StudentManagementSystem"
  );

  // Deploy the contract
  console.log("Deploying contract...");
  const contract = await StudentManagementSystem.deploy();

  // Wait for deployment to complete
  await contract.waitForDeployment();

  // Get the contract address
  const contractAddress = await contract.getAddress();

  console.log("✅ Contract deployed successfully!");
  console.log("Contract address:", contractAddress);
  console.log(
    "View on Lisk Sepolia Explorer:",
    `https://sepolia-blockscout.lisk.com/address/${contractAddress}`
  );
  console.log("Network: Lisk Sepolia Testnet");

  // Get deployment transaction details
  const deploymentTx = contract.deploymentTransaction();
  if (deploymentTx) {
    console.log("Transaction hash:", deploymentTx.hash);
    console.log("Gas used:", deploymentTx.gasLimit.toString());
  }
}

// Execute the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });
