import { ethers } from "hardhat";

async function main() {
  const contractAddress = "0x30e9c14eFAc597816D0A769B8Bdfa35EBeFFc8c9"; 
  const recipient = "0xb378f49E4814c140B14382605280361ff6384152"; 
  const tokenURI = "https://indigo-effective-porpoise-546.mypinata.cloud/ipfs/bafkreiausplr4is6u2quqxddzpm5ihqq2j4ogyq2skk53eyleetzqnfsw4"; 

  const MOSASNFT = await ethers.getContractFactory("MOSASNFT");
  const moNFT = await MOSASNFT.attach(contractAddress);
  const tx = await moNFT.mintNFT(recipient, tokenURI);
  const receipt = await tx.wait();
  const tokenId = receipt.logs[0].args.tokenId;
  console.log(`NFT minted with tokenId: ${tokenId}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1});