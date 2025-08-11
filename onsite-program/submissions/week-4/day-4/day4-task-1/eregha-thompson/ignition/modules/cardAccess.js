import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const AccessModule = buildModule("AccessModule", (m) => {
  const entry = m.contract("Entry");
  return { entry };
});



export default AccessModule;