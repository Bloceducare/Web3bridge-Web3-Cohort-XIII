import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const GarageAccessModule = buildModule("GarageAccessModule", (m) => {
  const garageAccess = m.contract("GarageAccess");

  return { garageAccess };
});

export default GarageAccessModule;