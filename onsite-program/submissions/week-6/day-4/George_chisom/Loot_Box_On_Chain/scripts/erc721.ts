import { network } from "hardhat";
const { ethers } = await network.connect({
  network: "hardhatOp",
  chainType: "op",
});

async function main() {
  const [deployer] = await ethers.getSigners();

  // Contract address from your deployment (replace with actual address)
  const contractAddress = deployer.address;
  const recipient = deployer.address; // Mint to deployer
  const tokenURI =
    "https://violet-certain-octopus-53.mypinata.cloud/ipfs/bafkreig7jbezhcilpz5rxl4vwjq3ln55ciohu2fzw7w7njk3qe2ergtioy";

  console.log("Deployer address:", deployer.address);
  console.log("Contract address:", contractAddress);
  console.log("Recipient:", recipient);

  // Get contract instance
  const LootBoxNFT = await ethers.getContractFactory("LootBoxNft");
  const myNFT = LootBoxNFT.attach(contractAddress);

  console.log("Minting NFT...");
  const mintTx = await myNFT.mint(recipient, tokenURI);
  console.log("Transaction hash:", mintTx.hash);

  const receipt = await mintTx.wait();
  console.log("Transaction confirmed in block:", receipt.blockNumber);

  // Parse Transfer event
  let tokenId = null;
  for (const log of receipt.logs) {
    try {
      const parsedLog = myNFT.interface.parseLog(log);
      if (parsedLog?.name === "Transfer") {
        tokenId = parsedLog.args.tokenId;
        console.log(`✅ NFT minted successfully!`);
        console.log(`Token ID: ${tokenId.toString()}`);
        console.log(`Owner: ${await myNFT.ownerOf(tokenId)}`);
        console.log(`Token URI: ${await myNFT.tokenURI(tokenId)}`);
        break;
      }
    } catch (error) {
      continue;
    }
  }

  if (!tokenId) {
    console.log("❌ Could not parse tokenId from events");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error.message);
    process.exit(1);
  });
