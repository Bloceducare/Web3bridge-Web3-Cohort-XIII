// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const ChronoStampNFTModule = buildModule("ChronoStampNFTModule", (m) => {

  const ChronoStamp = m.contract("ChronoStamp");

  return { ChronoStamp };
});

export default ChronoStampNFTModule;
