// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const GarageManagementSystemModule = buildModule("GarageManagementSystemModule", (m) => {


  const garageManagementSystem = m.contract("GarageManagementSystem")

  return { garageManagementSystem };
});

export default GarageManagementSystemModule;
