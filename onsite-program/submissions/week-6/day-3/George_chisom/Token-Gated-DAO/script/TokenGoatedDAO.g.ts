import { ethers } from "hardhat";
import hre from "hardhat";

async function main(): Promise<void> {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // Deploy NFT Contract
  const NFT = await hre.ethers.getContractFactory("Nft");
  const nft = await NFT.deploy(deployer.address);
  await nft.waitForDeployment();
  console.log("NFT deployed to:", await nft.getAddress());

  // Deploy ERC7432RoleRegistry
  const ERC7432RoleRegistry = await hre.ethers.getContractFactory(
    "ERC7432RoleRegistry"
  );
  const roleRegistry = await ERC7432RoleRegistry.deploy();
  await roleRegistry.waitForDeployment();
  console.log(
    "ERC7432RoleRegistry deployed to:",
    await roleRegistry.getAddress()
  );

  // Deploy TokenGatedDAO
  const TokenGatedDAO = await hre.ethers.getContractFactory("TokenGatedDao");
  const dao = await TokenGatedDAO.deploy(await roleRegistry.getAddress());
  await dao.waitForDeployment();
  console.log("TokenGatedDAO deployed to:", await dao.getAddress());

  // Mint an NFT for testing using the owner mint function
  const tokenURI = "ipfs://QmTestUri";
  const tx = await nft.mint(deployer.address, tokenURI);
  const receipt = await tx.wait();

  // Parse events in ethers v6
  const transferEvent = receipt.logs?.find((log) => {
    try {
      const parsed = nft.interface.parseLog(log);
      return parsed?.name === "Transfer";
    } catch {
      return false;
    }
  });

  const tokenId = transferEvent
    ? nft.interface.parseLog(transferEvent).args.tokenId
    : null;
  console.log("Minted NFT with tokenId:", tokenId?.toString());

  // Grant a Voter role for testing
  const voterRole = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("Voter()"));
  const role = {
    roleId: voterRole,
    tokenAddress: await nft.getAddress(),
    tokenId: tokenId,
    recipient: deployer.address,
    expirationDate: 0, // Set to 0 based on your contract logic
    revocable: true,
    data: "0x",
  };

  try {
    await roleRegistry.grantRole(role);
    console.log("Granted Voter role to:", deployer.address);
  } catch (error) {
    console.log(
      "Role granting failed (expected due to contract logic):",
      (error as Error).message
    );
    console.log("You may need to use an approved account to grant roles");
  }

  // Save deployment addresses for easy access
  console.log("\n=== DEPLOYMENT SUMMARY ===");
  console.log("NFT Address:", await nft.getAddress());
  console.log("RoleRegistry Address:", await roleRegistry.getAddress());
  console.log("DAO Address:", await dao.getAddress());
  console.log("Minted Token ID:", tokenId?.toString());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
