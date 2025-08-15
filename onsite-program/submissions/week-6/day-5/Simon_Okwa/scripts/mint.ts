import { ethers } from "hardhat";

async function main() {
  const contractAddress = "0x093e2Cf73a4Dd32D1b39c4bcd6CFB7bCdD378f75"; 
  const clockNFT = await ethers.getContractAt("ClockNFT", contractAddress);
  const tx = await clockNFT.mint();
  const receipt = await tx.wait();
  if (!receipt) throw new Error("Transaction receipt is null");
  const event = receipt.logs.find((log: any) => log.fragment?.name === "Minted") as any;
  const tokenId = event?.args?.tokenId?.toString();
  console.log(`Minted NFT #${tokenId} at https://sepolia.etherscan.io/token/${contractAddress}/instance/${tokenId}`);
}

main().catch(console.error);