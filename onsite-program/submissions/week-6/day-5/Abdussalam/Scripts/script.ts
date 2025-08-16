// import { ethers } from "hardhat";

// async function main() {
//   // Get signer (first account from Hardhat)
//   const [deployer, addr1] = await ethers.getSigners();
//   console.log("Minting with account:", deployer.address);

//   // Attach to an already deployed contract
//   const CosmicTimeNFT = await ethers.getContractFactory("CosmicTimeNFT", deployer);
//   const contract = await CosmicTimeNFT.deploy();
//   await contract.waitForDeployment();

//   console.log("CosmicTimeNFT deployed at:", await contract.getAddress());

//   // Call mint()
//     const cosmicWithAddr1 = CosmicTimeNFT.connect(addr1);
//   const minttx = await contract.connect(deployer).mint();
//   const receipt = await minttx.wait();

//   // Read tokenId from event logs (Transfer event)
//   // after deploying/attaching `contract` and having `addr1`
// const nextId = await contract.connect(addr1).mint(); // predicts return value
// const tx = await contract.connect(addr1).mint();
// await tx.wait();

// console.log(`✅ Minted NFT #${nextId} to ${addr1.address}`);


//   // Optionally, fetch tokenURI
//   const tokenURI = await contract.tokenURI(1);
//   console.log("Token URI:", tokenURI);
// }

// // Run the script
// main().catch((error) => {
//   console.error(error);
//   process.exitCode = 1;
// });



import { ethers } from "hardhat";

async function main() {
  const [deployer, addr1] = await ethers.getSigners();
  
  console.log("Minting with account:", deployer.address);

  // Deploy contract with deployer as signer
  const CosmicTimeNFTFactory = await ethers.getContractFactory("CosmicTimeNFT", deployer);
  const cosmicTimeNFT = await CosmicTimeNFTFactory.deploy();
  await cosmicTimeNFT.waitForDeployment();

  console.log("CosmicTimeNFT deployed at:", await cosmicTimeNFT.getAddress());

  // ✅ Connect addr1 as signer before minting
  const cosmicWithAddr1 = cosmicTimeNFT.connect(addr1);

  const tx = await cosmicWithAddr1.mint();
  const receipt = await tx.wait();

  console.log("✅ Minted NFT in block:", receipt.blockNumber);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
