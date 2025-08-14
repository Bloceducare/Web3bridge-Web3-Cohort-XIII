import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const TokenGatedDAOModule = buildModule("TokenGatedDAOModule", (m) => {

  const rolesRegistry = m.contract("RolesRegistry", []);

  const dao = m.contract("TokenGatedDAO", [rolesRegistry]);

  return { rolesRegistry, dao };
});

export default TokenGatedDAOModule;
