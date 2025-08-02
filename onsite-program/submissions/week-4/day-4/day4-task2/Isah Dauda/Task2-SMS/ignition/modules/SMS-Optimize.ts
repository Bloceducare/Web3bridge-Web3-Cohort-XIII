import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const SchoolManagementSystemModule = buildModule("SchoolManagementSystemModule", (m) => {
  const SchoolManagementSystem = m.contract("SchoolManagementSystem");

  return { SchoolManagementSystem };
});

export default SchoolManagementSystemModule;

//Yes
