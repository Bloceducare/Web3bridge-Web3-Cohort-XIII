const { ethers } = require("hardhat");

async function main() {
  console.log("Starting NFT deployment...");

  // Get the contract factory
  const DecentralizedNFT = await ethers.getContractFactory("DecentralizedNFT");

  // Constructor parameters
  const name = "My Decentralized NFT";
  const symbol = "DNFT";
  const baseTokenURI = "ipfs://QmYourBaseHashHere/";
  const contractMetadataURI = "ipfs://QmYourContractMetadataHashHere/contract.json";

  console.log("Deploying with parameters:");
  console.log("Name:", name);
  console.log("Symbol:", symbol);
  console.log("Base URI:", baseTokenURI);
  console.log("Contract URI:", contractMetadataURI);

  // Deploy the contract
  const contract = await DecentralizedNFT.deploy(
    name,
    symbol,
    baseTokenURI,
    contractMetadataURI
  );

  await contract.waitForDeployment();

  console.log("Contract deployed successfully!");
  console.log("Contract address:", await contract.getAddress());
  console.log("Transaction hash:", contract.deploymentTransaction()?.hash);
  console.log("Gas used:", contract.deploymentTransaction()?.gasLimit?.toString());

  // Wait for a few block confirmations
  console.log("Waiting for block confirmations...");
  await contract.deploymentTransaction()?.wait(5);

  console.log("Deployment confirmed!");

  // Verify contract details
  console.log("\nContract Details:");
  console.log("Name:", await contract.name());
  console.log("Symbol:", await contract.symbol());
  console.log("Max Supply:", await contract.MAX_SUPPLY());
  console.log("Mint Price:", ethers.formatEther(await contract.mintPrice()), "ETH");
  console.log("Owner:", await contract.owner());
  console.log("Total Supply:", await contract.totalSupply());

  console.log("\nNext Steps:");
  console.log("1. Upload your images to IPFS/Pinata");
  console.log("2. Create metadata JSON files with image URLs");
  console.log("3. Upload metadata to IPFS");
  console.log("4. Start minting NFTs!");

  return await contract.getAddress();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });