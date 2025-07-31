// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";


const AccessControlModule = buildModule("AccessControlModule", (m) => {
 
  const accessControl = m.contract("AccessControl");

  return { accessControl };
});

export default AccessControlModule;
