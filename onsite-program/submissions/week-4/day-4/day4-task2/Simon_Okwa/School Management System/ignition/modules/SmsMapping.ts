// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";


const SmsMappingModule = buildModule("SmsMappingModule", (m) => {
 
  const smsmapping = m.contract("SmsMapping");

  return { smsmapping };
});

export default SmsMappingModule;
