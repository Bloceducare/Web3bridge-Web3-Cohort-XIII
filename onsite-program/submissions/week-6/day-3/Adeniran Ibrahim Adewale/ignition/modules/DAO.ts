
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export const MockERC721Module = buildModule("MockERC721Module", (m) => {
    const mockERC721 = m.contract("MockERC721", ["RolesDAO", "RDAO"]);
    const rolesRegistry = m.contract("RolesRegistry");
    const tokenGatedDAO = m.contract("TokenGatedDAO", ["0x6Cac76f9e8d6F55b3823D8aEADEad970a5441b67"]);

  return { mockERC721, rolesRegistry, tokenGatedDAO };
});

export default MockERC721Module;


