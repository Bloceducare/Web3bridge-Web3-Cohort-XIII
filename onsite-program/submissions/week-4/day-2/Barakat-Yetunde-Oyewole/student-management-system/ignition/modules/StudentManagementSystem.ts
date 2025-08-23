// This setup uses Hardhat Ignition to manage smart contract deployments

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const JAN_1ST_2030 = 1893456000;
const ONE_GWEI: bigint = 1_000_000_000n;

const StudentModule = buildModule("StudentModule", (m) => {
  

  const student = m.contract("StudentManagementSystem", [], {
    
  });

  return { student };
});

export default StudentModule;
