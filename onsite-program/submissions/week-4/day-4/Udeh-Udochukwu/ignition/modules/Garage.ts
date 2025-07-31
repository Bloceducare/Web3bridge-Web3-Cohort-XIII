// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const Garage = buildModule("GarageModule", (m) => {
  const Garage = m.contract("Garage");
  return { Garage };
});

export default Garage;
