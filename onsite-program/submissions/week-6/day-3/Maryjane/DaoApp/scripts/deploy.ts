import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // Deploy SimpleNFT
  const SimpleNFT = await ethers.getContractFactory("SimpleNFT");
  const simpleNFT = await SimpleNFT.deploy();
  await simpleNFT.deployed();
  console.log("SimpleNFT deployed to:", simpleNFT.address);

  // Deploy NftRolesRegistryVault
  const NftRolesRegistryVault = await ethers.getContractFactory("NftRolesRegistryVault");
  const roleRegistry = await NftRolesRegistryVault.deploy();
  await roleRegistry.deployed();
  console.log("NftRolesRegistryVault deployed to:", roleRegistry.address);

  // Deploy DAO
  const DAO = await ethers.getContractFactory("DAO");
  const dao = await DAO.deploy(roleRegistry.address);
  await dao.deployed();
  console.log("DAO deployed to:", dao.address);

  // Mint an NFT and assign roles
  await simpleNFT.mint(deployer.address);
  await simpleNFT.approve(roleRegistry.address, 0); // Approve registry to transfer NFT
  const role: any = {
    tokenAddress: simpleNFT.address,
    tokenId: 0,
    roleId: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("CAN_PROPOSE")),
    recipient: deployer.address,
    expirationDate: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60, // 1 year
    revocable: true,
    data: "0x"
  };
  await roleRegistry.grantRole(role);
  // Assign additional roles
  await roleRegistry.grantRole({ ...role, roleId: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("CAN_VOTE")) });
  await roleRegistry.grantRole({ ...role, roleId: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("CAN_EXECUTE")) });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});