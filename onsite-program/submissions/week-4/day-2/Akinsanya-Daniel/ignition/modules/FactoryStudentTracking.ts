// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const FactoryStudentTracking = buildModule("FactoryStudentTracking", (m) => {
  const factoryStudentTracking = m.contract("FactoryStudentTracking");  
    return {factoryStudentTracking}
  });

export default FactoryStudentTracking;