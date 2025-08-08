// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const ERC721Module = buildModule("ERC721Module", (m) => {

  const erc = m.contract("Nft");

  return { erc };
});

export default ERC721Module;
