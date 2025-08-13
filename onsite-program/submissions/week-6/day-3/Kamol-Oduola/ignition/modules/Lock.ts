// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more: https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const MembershipNFTModule = buildModule("MembershipNFTModule", (m) => {
  // Step 1: Deploy the MembershipNFT contract
  const membership = m.contract("MembershipNFT");

  // Step 2: Define voting period (example: 1 week in seconds)
  // You can change this to whatever your DAO expects
  const votingPeriod = 7 * 24 * 60 * 60; // 604800 seconds

  // Step 3: Deploy TokenGatedDAO with BOTH constructor parameters
  // Pass the deployed MembershipNFT reference, NOT just its address
  const gatedDao = m.contract("TokenGatedDAO", [membership, votingPeriod]);

  // Step 4: Return deployed contracts so they can be used later
  return { membership, gatedDao };
});

export default MembershipNFTModule;
