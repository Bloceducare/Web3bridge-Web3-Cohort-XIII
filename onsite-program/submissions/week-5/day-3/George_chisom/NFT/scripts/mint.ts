import { ethers } from "hardhat";

async function main() {
  const contractAddress = "0x2FD20D692B5B93f90b38a25Cc5Bf1f849D9E0374"; // From deploy.ts output
  const recipient = "0xe099fA204938657fd6F81671d1f7d14ec669B24D"; // Your MetaMask address
  const tokenURI =
    "https://violet-certain-octopus-53.mypinata.cloud/ipfs/bafkreien5obwxaaswdxexwzuxtcbyzojbgp2x6v4444nwdgsp5hliltaie"; // From Pinata metadata upload

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
