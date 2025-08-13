import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with:", deployer.address);


  const RoleNFT = await ethers.getContractFactory("RoleNFT");
  const roleNFT = await RoleNFT.deploy();
  await roleNFT.deployed();
  console.log("RoleNFT deployed to:", roleNFT.address);

  const tokenId = 1;
  const tokenURI = "ipfs://example-uri";
  await roleNFT.mint(deployer.address, tokenId, tokenURI);
  console.log(`Minted NFT #${tokenId} to ${deployer.address}`);

  await roleNFT.assignRole(tokenId, "PROPOSER");
  console.log(`Assigned role 'PROPOSER' to token #${tokenId}`);

  
  const DAO = await ethers.getContractFactory("TokenGatedDAO");
  const dao = await DAO.deploy(roleNFT.address);
  await dao.deployed();
  console.log("TokenGatedDAO deployed to:", dao.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
