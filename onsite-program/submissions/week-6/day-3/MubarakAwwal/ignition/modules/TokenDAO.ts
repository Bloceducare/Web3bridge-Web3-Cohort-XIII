import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const RoleGatedDAOModule = buildModule("RoleGatedDAO", (m) => {
 
 const governanceNFT = m.contract("GovernanceNFT");

  
  const rolesRegistry = m.contract("BasicRolesRegistry", []);

  
  const RoleGatedDAO = m.contract("RoleGatedDAO", [
    governanceNFT, 
    rolesRegistry, 
  ]);

  return { governanceNFT, rolesRegistry, RoleGatedDAO };
});

export default  RoleGatedDAOModule;

