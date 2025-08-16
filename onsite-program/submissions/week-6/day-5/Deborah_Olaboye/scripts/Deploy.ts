import { ethers } from "hardhat";

async function main() {
  // Use the provided contract address
  const CONTRACT_ADDRESS = "0xEeDE2C2A10fc6F659A4A532Bbb858B4641db2668";

  // Get the contract factory and attach to the deployed contract
  const OnChainNFT = await ethers.getContractFactory("OnChainNFT");
  const contract = await OnChainNFT.attach(CONTRACT_ADDRESS);

  // Get the signer
  const [signer] = await ethers.getSigners();
  console.log("Minting NFT with signer:", signer.address);

  // Verify the signer is the owner
  const owner = await contract.owner();
  console.log("Contract owner:", owner);
  if (owner.toLowerCase() !== signer.address.toLowerCase()) {
    throw new Error(`Signer ${signer.address} is not the contract owner (${owner})`);
  }

  // Call the mint function (no parameters needed)
  console.log("Minting SVG NFT...");
  let tx;
  try {
    tx = await contract.mint();
    console.log("Transaction submitted:", tx.hash);
  } catch (error) {
    throw new Error(`Mint transaction failed: ${error.message}`);
  }

  // Wait for the transaction to be mined and get the receipt
  let receipt;
  try {
    receipt = await tx.wait();
  } catch (error) {
    throw new Error(`Failed to mine transaction ${tx.hash}: ${error.message}`);
  }

  // Check transaction status
  if (receipt.status !== 1) {
    console.log("Transaction receipt:", receipt);
    throw new Error(`Transaction ${tx.hash} failed with status ${receipt.status}`);
  }

  // Extract the token ID from the Minted event using logs
  const iface = new ethers.Interface([
    "event Minted(uint256 tokenId)"
  ]);
  let tokenId;
  for (const log of receipt.logs) {
    try {
      const parsed = iface.parseLog(log);
      if (parsed.name === "Minted") {
        tokenId = parsed.args.tokenId;
        break;
      }
    } catch (e) {
      // Not the Minted event, skip
    }
  }
  if (!tokenId) {
    console.log("Logs in receipt:", receipt.logs);
    throw new Error("Minted event not found in transaction logs");
  }
  console.log(`SVG NFT minted successfully with token ID: ${tokenId}`);

  // Fetch and display the tokenURI to verify the SVG
  const tokenURI = await contract.tokenURI(tokenId);
  console.log("Token URI:", tokenURI);
}

main().catch((error) => {
  console.error("Error minting NFT:", error);
  process.exitCode = 1;
});