// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const StudentMgtModule = buildModule("StudentMgtModule", (m) => {
  
  const StudentMgt = m.contract("StudentMgt", [], {
  });

  return { StudentMgt };
});

export default StudentMgtModule;
