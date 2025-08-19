// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";


const schoolMngtModule = buildModule("schoolMngtModule", (m) => {

  const schoolMngt = m.contract("SchoolManagementSystem", [], {
  });

  return { schoolMngt };
});

export default schoolMngtModule;
