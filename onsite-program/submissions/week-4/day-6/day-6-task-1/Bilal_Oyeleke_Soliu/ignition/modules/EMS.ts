// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";


const EMSModule = buildModule("EMSModule", (m) => {

  const ems = m.contract("BilalEnterprise");

  return { ems };
});

export default EMSModule;
