import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";


const AccessManagementSystemModule = buildModule("AccessManagementSystemModule", (m) => {

  const accessManagementSystem = m.contract("AccessManagementSystem");

  return { accessManagementSystem };
});

export default AccessManagementSystemModule;