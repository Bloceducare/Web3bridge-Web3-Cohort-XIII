import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const factoryModule = buildModule("factoryModule", (m) => {
  const employeeFactory = m.contract("employeeFactory");
  return { employeeFactory };
});

export default factoryModule;
