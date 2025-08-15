// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";



const ClockNFTModule = buildModule("ClockNFTModule", (m) => {
 
  const clocknft = m.contract("ClockNFT");

  return { clocknft };
});


export default ClockNFTModule;


