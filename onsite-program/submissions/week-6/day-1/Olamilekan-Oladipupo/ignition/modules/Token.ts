// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const TokenModule = buildModule("TokenModule", (m) => {
    const _initialSupply  = 1000000000000000;
 

  const Token = m.contract("Token", [_initialSupply]);
  return { Token };
});

export default TokenModule;

