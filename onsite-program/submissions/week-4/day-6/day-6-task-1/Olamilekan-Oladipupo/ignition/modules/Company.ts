// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const CompanyModule = buildModule("CompanyModule", (m) => {

  const Company = m.contract("Company");
  return { Company };
});

export default CompanyModule;

