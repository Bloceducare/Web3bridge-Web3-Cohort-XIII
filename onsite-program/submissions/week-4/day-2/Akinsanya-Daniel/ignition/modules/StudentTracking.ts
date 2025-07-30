// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const StudentTrackingModule = buildModule("StudentTrackingModule", (m) => {
  const StudentTracking = m.contract("StudentTracking");  
    return {StudentTracking}
  });

export default StudentTrackingModule;
