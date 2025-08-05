// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
  

const ERC20TokenModule = buildModule("ERC20TokenV2Module", (m) => {
  const _name = "MAVERICK";
  const _symbol = "MVK";
  const _totalSupply = 100000000;

  const ERC20Token = m.contract("ERC20Token", [_name, _symbol, _totalSupply]);

  return { ERC20Token };
});

export default ERC20TokenModule;