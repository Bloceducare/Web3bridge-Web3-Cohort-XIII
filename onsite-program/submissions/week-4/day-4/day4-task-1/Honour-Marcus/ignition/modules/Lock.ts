// ignition/modules/AccessFactoryModule.ts

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const AccessFactoryModule = buildModule("AccessFactoryModule", (m) => {
  const accessFactory = m.contract("AccessControlFactory");

  return { accessFactory };
});

export default AccessFactoryModule;
