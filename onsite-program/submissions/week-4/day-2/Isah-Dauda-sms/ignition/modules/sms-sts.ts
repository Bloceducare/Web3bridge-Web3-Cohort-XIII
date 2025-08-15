import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const schoolManagementSystemModule = buildModule("schoolManagementSystemModule", (m) => {
  const schoolManagementSystem = m.contract("schoolManagementSystem"); // no constructor arguments

  return { schoolManagementSystem };
});

export default schoolManagementSystemModule;
