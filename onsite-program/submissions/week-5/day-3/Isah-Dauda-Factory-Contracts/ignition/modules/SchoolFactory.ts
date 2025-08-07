import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const DeploySchoolFactoryModule = buildModule("DeploySchoolFactoryModule", (m) => {
  const schoolFactory = m.contract("SchoolManagementSystemFactory");

  const schoolContractTx = m.call(schoolFactory, "createSchoolManagementSystem", []);
  const allContracts = m.call(schoolFactory, "getAllSchools", []);

  return { schoolFactory, schoolContractTx, allContracts };
});

export default DeploySchoolFactoryModule;
