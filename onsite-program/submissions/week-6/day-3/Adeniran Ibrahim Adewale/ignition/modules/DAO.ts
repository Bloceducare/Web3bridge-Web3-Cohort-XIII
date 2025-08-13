
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export const MockERC721Module = buildModule("MockERC721Module", (m) => {
    const mockERC721 = m.contract("MockERC721");

  return { mockERC721 };
});

// export default MockERC721Module RolesRegistryModule;

export const RolesRegistryModule = buildModule("RolesRegistryModule", (m) => {
    const rolesRegistry = m.contract("RolesRegistry");

  return { rolesRegistry };
});


export const TokenGatedDAOModule = buildModule("TokenGatedDAOModule", (m) => {
    const tokenGatedDAO = m.contract("TokenGatedDAO");

  return { tokenGatedDAO };
});


