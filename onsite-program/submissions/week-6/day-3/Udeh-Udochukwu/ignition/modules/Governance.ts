// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const Governance = buildModule("Governance", (m) => {
  const Governance = m.contract("Governance");
  return { Governance };
});

export default Governance;