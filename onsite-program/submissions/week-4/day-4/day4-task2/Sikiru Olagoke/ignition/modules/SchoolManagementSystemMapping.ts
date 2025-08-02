// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const SchoolManagementSystemMappingModule = buildModule(
  "SchoolManagementSystemMappingModule",
  (m) => {
    const schoolManagementSystemMapping = m.contract(
      "SchoolManagementSystemMapping"
    );

    return { schoolManagementSystemMapping };
  }
);

export default SchoolManagementSystemMappingModule;
