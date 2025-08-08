import { ethers } from "hardhat";

async function main() {
  const contractAddress = "0x418302DaB7A072d1331c37cD703af7d661d173c4"; // From deploy.ts output
  const recipient = "0xe099fA204938657fd6F81671d1f7d14ec669B24D"; // Your MetaMask address
  const tokenURI =
    "ipfs://bafybeiacr3jirch4m5rc2mutzyv4wc7hxejn5txdu6ab3att3iwujbzyju"; // From Pinata metadata upload

  const MyNFT = await ethers.getContractFactory("MyNFT");
  const myNFT = await MyNFT.attach(contractAddress);
  const mintNFT = await myNFT.mintNFT(recipient, tokenURI);
  const receipt = await mintNFT.wait();
  const tokenId = receipt.logs[0].args.tokenId;
  console.log(`NFT minted with tokenId: ${tokenId}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
