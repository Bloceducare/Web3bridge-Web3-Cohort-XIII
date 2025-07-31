// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";


const SchoolAccessModule = buildModule("SchoolAccessModule", (m) => {
  
  const schoolAccess = m.contract("SchoolAccess");

  return { schoolAccess };
});

export default SchoolAccessModule;
