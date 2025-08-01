import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const Web3GarageAccessModule = buildModule("Web3GarageAccessModule", (m) => {
  const web3GarageAccess = m.contract("Web3GarageAccess");

  return { web3GarageAccess };
});

export default Web3GarageAccessModule;