import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const SchoolManagementStaffModule = buildModule("SchoolManagementStaff", (m) => {
  const SchoolManagementStaff = m.contract("SchoolManagementStaff");

  return { SchoolManagementStaff };
});

export default SchoolManagementStaffModule;

//Yes
