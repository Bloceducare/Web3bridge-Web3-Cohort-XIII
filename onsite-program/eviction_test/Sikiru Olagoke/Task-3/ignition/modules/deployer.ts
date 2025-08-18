// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const ContractModule = buildModule("ContractModule", (m) => {
  const ludoToken = m.contract("LudoToken");

  return { ludoToken };
});

export default ContractModule;
