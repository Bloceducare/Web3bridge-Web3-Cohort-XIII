import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const RoleGatedDAOModule = buildModule("RoleGatedDAOModule", (m) => {
  const RoleNFT = m.contract("RoleNFT");
  const roles = m.contract("Roles", [RoleNFT]);
  const roleGatedDAO = m.contract("RoleGatedDAO", [RoleNFT, roles]);

  return { RoleNFT, roles, roleGatedDAO };
});

export default RoleGatedDAOModule;