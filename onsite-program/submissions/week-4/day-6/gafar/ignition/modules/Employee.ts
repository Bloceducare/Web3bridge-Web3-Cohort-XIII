// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const EmployeeSystemModule = buildModule("EmployeeSystemModule", (m) => {

  const employee = m.contract("EmployeeSystem");

  return { employee };
});

export default EmployeeSystemModule;
