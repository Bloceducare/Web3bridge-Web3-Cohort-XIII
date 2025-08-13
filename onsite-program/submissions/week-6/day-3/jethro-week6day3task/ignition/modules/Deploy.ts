import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

module.exports = buildModule("Deploy", (m) => {
  const membershipNFT = m.contract("MembershipNFT");
  const rolesRegistry = m.contract("RolesRegistry");
  const roleGatedGovernor = m.contract("RoleGatedGovernor", [membershipNFT, rolesRegistry]);

  return { membershipNFT, rolesRegistry, roleGatedGovernor };
});