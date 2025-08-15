// scripts/deploy.ts
import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with account:", deployer.address);

  // --- CONFIGURE THESE VALUES ---
  const VRF_COORDINATOR = "0x1427b01389e71499e3529629342e9a82598a3282"; // Lisk Sepolia VRF Coordinator
  const SUB_ID = 12345n; // Replace with your actual Chainlink subscription ID
  const KEY_HASH = "0x473912708fe4925378888d4779167aa542f227892296c6989021162d14b4e2e4"; // Example key hash
  const BOX_FEE = ethers.parseEther("0.01"); // 0.01 ETH
  const TREASURY = ethers.ZeroAddress; // Use ZeroAddress for address(0)
  // ------------------------------

  console.log("Box fee (wei):", BOX_FEE.toString());

  const LootBox = await ethers.getContractFactory("LootBox");
  const lootBox = await LootBox.deploy(
    VRF_COORDINATOR,
    SUB_ID,
    KEY_HASH,
    BOX_FEE,
    TREASURY
  );

  await lootBox.waitForDeployment();

  const address = await lootBox.getAddress();
  console.log("LootBox deployed to:", address);

  console.log("Constructor args:");
  console.log({
    VRF_COORDINATOR,
    SUB_ID: SUB_ID.toString(),
    KEY_HASH,
    BOX_FEE: BOX_FEE.toString(),
    TREASURY: TREASURY === ethers.ZeroAddress ? "(address(0))" : TREASURY,
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error during deployment:", error);
    process.exit(1);
  });