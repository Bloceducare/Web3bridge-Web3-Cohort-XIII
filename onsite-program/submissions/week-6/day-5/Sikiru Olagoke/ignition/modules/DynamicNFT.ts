// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";


const DynamicNFTModule = buildModule("DynamicNFTModule", (m) => {

  const dynamicNFT = m.contract("DynamicNFT");

  return { dynamicNFT };
});

export default DynamicNFTModule;
