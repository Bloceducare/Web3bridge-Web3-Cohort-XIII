// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";


const Web3BridgeAccessModule = buildModule("Web3BridgeAccessModule", (m) => {
  
  const web3bridgeaccess= m.contract("Web3BridgeAccess");

  return { web3bridgeaccess };
});

export default Web3BridgeAccessModule;
