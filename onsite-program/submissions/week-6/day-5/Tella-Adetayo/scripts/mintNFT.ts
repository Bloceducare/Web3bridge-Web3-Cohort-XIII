import { ethers } from "hardhat";

async function main() {
  const contractAddress = "0x2331B698eeE9bEaE834B06B6bDCb2DF94c9a01A3"; 
  const clockNFT = await ethers.getContractAt("EShockUNFT", contractAddress);
  const tx = await clockNFT.mint();
  const receipt = await tx.wait();
  if (!receipt) throw new Error("Transaction receipt is null");
  const event = receipt.logs.find((log: any) => log.fragment?.name === "Minted") as any;
  const tokenId = event?.args?.tokenId?.toString();
  console.log(`Minted NFT #${tokenId} at https://sepolia.etherscan.io/token/${contractAddress}/instance/${tokenId}`);
}

main().catch(console.error);