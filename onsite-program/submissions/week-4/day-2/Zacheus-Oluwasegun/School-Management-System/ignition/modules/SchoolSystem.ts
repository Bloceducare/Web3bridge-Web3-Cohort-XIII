import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const SchoolSystemModule = buildModule("SchoolSystemModule", (m) => {

  const schoolSystem = m.contract("SchoolSystem");

  return { schoolSystem };
});

export default SchoolSystemModule;
