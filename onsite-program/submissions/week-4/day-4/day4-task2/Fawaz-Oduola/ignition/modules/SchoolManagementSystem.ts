// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";


const SchoolManagementSystemModule = buildModule("SchoolManagementSystemModule", (m) => {
 
  const schoolManagementSystem = m.contract("SchoolManagementSystem");

  return { schoolManagementSystem };
});

export default SchoolManagementSystemModule;
