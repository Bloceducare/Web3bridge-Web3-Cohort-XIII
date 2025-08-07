import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";


const SchoolManagementSystemModule = buildModule("SchoolManagementSystemModule", (m) => {
  const schoolManagementSystem = m.contract("SchoolManagementSystem");
  return { schoolManagementSystem };
});

export default SchoolManagementSystemModule;