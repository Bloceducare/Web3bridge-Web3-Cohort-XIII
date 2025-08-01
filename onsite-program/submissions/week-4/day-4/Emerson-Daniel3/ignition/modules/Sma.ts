import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const SchoolManagementModule = buildModule("SchoolManagement", (m) => {
  const schoolmanagement = m.contract("SchoolManagement");
  

  return { schoolmanagement };
});

export default SchoolManagementModule;