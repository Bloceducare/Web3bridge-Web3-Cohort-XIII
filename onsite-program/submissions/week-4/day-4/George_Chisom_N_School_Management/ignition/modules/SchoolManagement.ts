import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const SchoolManagementModule = buildModule("SchoolManagementModule", (m) => {
  const task = m.contract("SchoolManagement");

  return { task };
});

export default SchoolManagementModule;