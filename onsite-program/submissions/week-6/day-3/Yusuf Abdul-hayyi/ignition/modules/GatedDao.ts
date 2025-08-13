// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";


const GatedDAOModule = buildModule("GatedDAOModule", (m) => {
  const nft = "0x0fB5BFFaBc5a988283B20dBeA94867Daf28eFe93";
  const registry = "0x1718C5eBD62bece69168877DA4f873AD1e65Aef1"
  

  const gatedDao = m.contract("GatedDAO", [nft, registry]);

  return { gatedDao };
});

export default GatedDAOModule;
