import { ethers } from "hardhat";


async function main() {
  const contractAddress = process.env.CONTRACT_ADDRESS;
  const recipient = process.env.WALLET_ADDRESS;
  const tokenURI = process.env.TOKEN_URI;
  const MyNFT = await ethers.getContractAt("MyNFT", contractAddress);
  const tx = await MyNFT.mintNFT(recipient, tokenURI);
  await tx.wait();
  await tx.wait();

  console.log(`NFT minted to ${recipient} with tokenURI ${tokenURI}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });