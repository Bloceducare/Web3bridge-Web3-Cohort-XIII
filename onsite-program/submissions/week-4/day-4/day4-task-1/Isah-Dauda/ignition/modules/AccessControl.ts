import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const garageAccessModule = buildModule("garageAccessModule", (m) => {
  const garageAccess = m.contract("garageAccess");

  return { garageAccess };
});

export default garageAccessModule;

//Yes
