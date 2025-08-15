// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const SMSModule = buildModule("SMSModule", (m) => {
  const sms = m.contract("SMS"); 
  
  return { sms };
});

export default SMSModule;
