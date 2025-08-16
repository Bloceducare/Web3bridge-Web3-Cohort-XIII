// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";


const CosmicTimeNFTModule = buildModule("CosmicTimeNFTModule", (m) => {

  const cosmictimenft = m.contract("CosmicTimeNFT");

  return { cosmictimenft };
});

export default CosmicTimeNFTModule;
