import { ethers } from "hardhat";

async function main(): Promise<void> {
  const contractAddress = "0x4e71D9e607E641871EF1A1B97879CEfAb12075e0";
  
  const DynamicClockNFT = await ethers.getContractFactory("DynamicClockNFT");
  const contract = await DynamicClockNFT.attach(contractAddress);
  
  const tx = await contract.mint({ value: ethers.parseEther("0.001") });
  await tx.wait();
  
  console.log("NFT minted! Hash:", tx.hash);
}

main().catch(console.error);