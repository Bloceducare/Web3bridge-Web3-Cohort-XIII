// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";



const DAOModule = buildModule("DAOModule", (m) => {
  
  const erc7432 = m.contract("ERC7432ImmutableRegistry");
  const DAONFT = m.contract("GatedDAO");
  const DAO = m.contract("DAO", [erc7432, DAONFT]);

  return { DAO, DAONFT, erc7432 };
});

export default DAOModule;
