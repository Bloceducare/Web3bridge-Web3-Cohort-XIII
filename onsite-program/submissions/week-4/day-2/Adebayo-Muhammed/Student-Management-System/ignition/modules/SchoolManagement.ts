import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const SchoolManagementModule = buildModule("SchoolManagementModule", (m) => {
  const schoolManagement = m.contract("SchoolManagement");

  return { schoolManagement };
});

export default SchoolManagementModule;