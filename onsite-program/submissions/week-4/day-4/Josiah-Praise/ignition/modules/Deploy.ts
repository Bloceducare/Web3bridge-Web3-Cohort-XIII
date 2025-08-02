import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const GarageAccessControlModule = buildModule(
  "GarageAccessControlModule",

  (m) => {
    const garageAccessControl = m.contract("GarageAccessControl");

    return { garageAccessControl };
  }
);

export default GarageAccessControlModule;
