// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";



const WEB3BModule = buildModule("WEB3BModule", (m) => {

  const _name = "Web3BToken";
  const _symbol = "W3B";
  const _decimals = 18;
  const _totalSupply = 100000000;
  
  const web3b = m.contract("WEB3B", [_name,_symbol,_decimals,_totalSupply]);

  return { web3b };
});

export default WEB3BModule;
