const { ethers } = require("hardhat");

async function main() {
  // Get the contract factory
  const MyNFT = await ethers.getContractFactory("MyNFT");

  // Deploy the contract
  console.log("Deploying MyNFT...");
  const myNFT = await MyNFT.deploy();
  await myNFT.waitForDeployment();

  const contractAddress = await myNFT.getAddress();
  console.log("MyNFT deployed to:", contractAddress);

  // Optional: Mint an NFT immediately after deployment
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // Replace this with your IPFS metadata URL
  const tokenURI =
    "https://gateway.pinata.cloud/ipfs/bafkreib2zeagptw4qksqbycljblulvol6uxzzc6jxvp2ll5tmmdfana4vq";

  console.log("Minting NFT...");
  const mintTx = await myNFT.mintNFT(deployer.address, tokenURI);
  await mintTx.wait();

  console.log("NFT minted! Token ID: 0");
  console.log(
    `View on OpenSea: https://testnets.opensea.io/assets/sepolia/${contractAddress}/0`
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
