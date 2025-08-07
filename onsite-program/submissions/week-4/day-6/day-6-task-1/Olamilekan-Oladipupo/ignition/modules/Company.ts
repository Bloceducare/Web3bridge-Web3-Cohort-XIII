// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const CompanyModule = buildModule("CompanyModule", (m) => {
  const owner = "0x56C3da91721FeC41B3e1D859729B1B19a00A0F63";
  m.getParameter("owner", owner)

  const Company = m.contract("Company", [owner]);
  return { Company };
});

export default CompanyModule;

