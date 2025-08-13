// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const TokenGatedDAOModule = buildModule("TokenGatedDAOModule", (m) => {
  const gatedDao = m.contract("TokenGatedDAO");

  return { gatedDao };
});

export default TokenGatedDAOModule;
