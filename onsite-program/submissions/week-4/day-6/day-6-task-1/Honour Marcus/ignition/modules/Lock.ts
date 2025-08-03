import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const employeeModule = buildModule("employee", (m) => {
  const employee = m.contract("employee");

  return { employee };
});

export default employeeModule;

//Yes