import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

/**
 * Hardhat Ignition module for deploying DynamicTimeNFT contract
 *
 * This module deploys the DynamicTimeNFT contract which creates NFTs
 * that display the current block timestamp as a digital clock.
 *
 * Usage:
 * - Local deployment: npx hardhat ignition deploy ignition/modules/Deploy.ts
 * - Sepolia deployment: npx hardhat ignition deploy ignition/modules/Deploy.ts --network sepolia
 * - With verification: npx hardhat ignition deploy ignition/modules/Deploy.ts --network sepolia --verify
 */
const DynamicTimeNFTModule = buildModule("DynamicTimeNFTModule", (m) => {
  // Deploy the DynamicTimeNFT contract
  const dynamicTimeNFT = m.contract("DynamicTimeNFT", []);

  // Return the deployed contract for use in other modules or scripts
  return { dynamicTimeNFT };
});

export default DynamicTimeNFTModule;