// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const RoleNFTModule = buildModule("RoleNFTModule", (m) => {
  const rolenft = m.contract("RoleNFT"); 
  return { rolenft };
});

export default RoleNFTModule;
