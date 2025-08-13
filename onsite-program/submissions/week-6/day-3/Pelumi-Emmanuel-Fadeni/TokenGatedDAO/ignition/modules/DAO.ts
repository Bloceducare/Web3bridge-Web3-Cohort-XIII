import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const DAOModule = buildModule("DAOModule", (m) => {
  const nft = m.contract("MyNFT");
  const roles = m.contract("RolesRegistry");
  const dao = m.contract("TokenGatedDAO", [nft, roles]);
  return { nft, roles, dao };
});

export default DAOModule;