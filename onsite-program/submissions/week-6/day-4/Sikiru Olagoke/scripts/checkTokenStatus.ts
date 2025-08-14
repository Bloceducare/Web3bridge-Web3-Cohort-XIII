const { ethers } = require("hardhat");

async function checkTokenStatus() {
  const contractAddress = "0x402644b4b0Cd6D118d0D5C53e5A8aef523348861";
  const tokenId = 1;
  const caller = "0xE2cD6bBad217C1495B023dBa35b40236280Dc356";
  const operator = caller; // Adjust if operator is different

  // Get the contract instance
  const ERC721 = await ethers.getContractAt("IERC721", contractAddress);
  
  // Check token owner
  const owner = await ERC721.ownerOf(tokenId);
  console.log(`Owner of token ${tokenId}: ${owner}`);

  // Check if caller is approved for all
  const isApproved = await ERC721.isApprovedForAll(owner, operator);
  console.log(`Is ${operator} approved for all tokens of ${owner}? ${isApproved}`);
}

checkTokenStatus()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
