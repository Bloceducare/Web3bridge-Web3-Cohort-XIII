// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const EmployeeSystem = buildModule("EmployeeSystem", (m) => {
  const EmployeeSystem = m.contract("EmployeeSystem");
  return { EmployeeSystem };
});

export default EmployeeSystem;
