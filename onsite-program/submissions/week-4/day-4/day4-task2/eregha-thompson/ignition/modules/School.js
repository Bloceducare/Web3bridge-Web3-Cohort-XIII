import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const SchoolModule = buildModule("SchoolModule", (m) => {
  const SchoolManagementSystem = m.contract("SchoolManagementSystem");
  return { SchoolManagementSystem };
});



export default SchoolModule;