import { ethers } from "hardhat";
import hre from "hardhat";

async function main() {
  console.log("Deploying ERC721 contract...");

  // Get the contract factory
  const ERC721 = await ethers.getContractFactory("ERC721");

  // Deploy with constructor arguments
  const nft = await ERC721.deploy("Lawal's NFT Collection", "LNC");

  // Wait for deployment (ethers v6 syntax)
  await nft.waitForDeployment();

  const contractAddress = await nft.getAddress();
  console.log("ERC721 deployed to:", contractAddress);

  // Wait for block confirmations (ethers v6 syntax)
  console.log("Waiting for block confirmations...");
  const deploymentTx = nft.deploymentTransaction();
  if (deploymentTx) {
    await deploymentTx.wait(5);
  }

  // Verify contract
  console.log("Verifying contract...");
  try {
    await hre.run("verify:verify", {
      address: contractAddress,
      constructorArguments: ["Lawal's NFT Collection", "LNC"],
    });
    console.log("Contract verified successfully");
  } catch (err: any) {
    console.log("Verification failed:", err.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
