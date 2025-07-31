// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const AccessGarage = buildModule("AccessGarage", (m) => {

  const accessGarage= m.contract("AccessGarage");

  return { accessGarage};
});

export default AccessGarage;
