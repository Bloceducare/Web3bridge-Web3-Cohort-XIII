import { ethers } from "hardhat";

async function main(): Promise<void> {
  const MyNFT = await ethers.getContractAt("MyNFT", "<your_contract_address>");
  await MyNFT.mintNFT("<your_wallet_address>");
  console.log("NFT minted!");
}

main().catch((error: Error) => {
  console.error(error);
  process.exitCode = 1);
});