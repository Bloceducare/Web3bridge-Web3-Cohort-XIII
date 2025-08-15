// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const TimeModule = buildModule("TimeModule", (m) => {

  const time = m.contract("TimeNFT");

  return { time };
});

export default TimeModule;
