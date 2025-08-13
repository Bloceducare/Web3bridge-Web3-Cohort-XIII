import { ethers } from "hardhat";
import { } from "../typechain-types";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  const ERC721Factory = await ethers.getContractFactory("ZenDAO");
  const nftContract = await ERC721Factory.deploy(deployer.address);
  await nftContract.waitForDeployment();
  const nftAddress = await nftContract.getAddress();

  const ERC7432Factory = await ethers.getContractFactory("ERC7432");
  const roleRegistry = await ERC7432Factory.deploy();
  await roleRegistry.waitForDeployment();
  const roleRegistryAddress = await roleRegistry.getAddress();

  const GovernanceFactory = await ethers.getContractFactory("ZenDAOGovernance");
  const governance = await GovernanceFactory.deploy(nftAddress, roleRegistryAddress, deployer.address);
  await governance.waitForDeployment();
  const governanceAddress = await governance.getAddress();

  // Log all addresses
  console.log("\nDeployed contract addresses:");
  console.log("-----------------------------");
  console.log("NFT:", nftAddress);
  console.log("Role Registry:", roleRegistryAddress);
  console.log("ZenDAOGovernance:", governanceAddress);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });