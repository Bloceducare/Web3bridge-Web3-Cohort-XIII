const hre = require("hardhat");

async function main() {
  const contractAddress = "0x1dfA94Ebf3adb284Af3e26824895054D37Cda4D9"; // replace with your deployed address

  const MyNFT = await hre.ethers.getContractFactory("MyNFT");
  const myNFT = await MyNFT.attach(contractAddress);

  const [deployer] = await hre.ethers.getSigners();
  console.log("Minting NFT to:", deployer.address);

  const txResponse = await myNFT.mintNFT(deployer.address);
  console.log("📤 Mint transaction sent... waiting for confirmation");

  // ✅ Correct way to wait and get receipt
  const receipt = await txResponse.wait();

  console.log("✅ NFT Minted!");
  console.log("📦 Transaction Hash:", receipt.transactionHash);

  const tokenId = await myNFT.tokenCounter();
  console.log("🆔 Token ID:", tokenId.toString());
}

main().catch((error) => {
  console.error("❌ Error minting NFT:", error);
  process.exitCode = 1;
});
