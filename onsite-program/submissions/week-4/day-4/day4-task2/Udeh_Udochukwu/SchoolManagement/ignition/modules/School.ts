// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const School = buildModule("SchoolModule", (m) => {
  const School = m.contract("School");
  return { School };
});

export default School;
