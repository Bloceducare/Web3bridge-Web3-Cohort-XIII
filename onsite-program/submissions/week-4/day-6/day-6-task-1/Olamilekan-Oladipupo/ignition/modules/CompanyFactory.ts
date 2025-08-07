// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const CompanyFactoryModule = buildModule("CompanyFactoryModule", (m) => {

  const CompanyFactory = m.contract("CompanyFactory");
  return { CompanyFactory };
});

export default CompanyFactoryModule;

