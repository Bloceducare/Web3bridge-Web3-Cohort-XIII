// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";


const SmsModule = buildModule("SmsModule", (m) => {


  const sms = m.contract("Sms");

  return { sms };
});

export default SmsModule;
