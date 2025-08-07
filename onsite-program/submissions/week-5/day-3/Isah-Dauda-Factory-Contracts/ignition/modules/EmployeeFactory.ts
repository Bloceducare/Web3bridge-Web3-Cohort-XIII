// ignition/deployments/DeployStaffFactory.ts

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const DeployStaffFactoryModule = buildModule("DeployStaffFactoryModule", (m) => {
  const staffFactory = m.contract("SchoolManagementStaffFactory");

  const staffContractTx = m.call(staffFactory, "createStaffContract", []);
  const allContracts = m.call(staffFactory, "getAllStaffContracts", []);

  return { staffFactory, staffContractTx, allContracts };
});

export default DeployStaffFactoryModule;
