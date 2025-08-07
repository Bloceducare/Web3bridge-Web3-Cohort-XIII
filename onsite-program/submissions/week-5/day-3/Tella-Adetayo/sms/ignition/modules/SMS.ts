// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { vars } from "hardhat/config";

const SMSModule = buildModule("SMSModuleV2", (m) => {
  // Provide the constructor argument here
  //const adminAddress = vars.get("ADDRESS");

  const sms = m.contract("SMSFactory");

  return { sms };
});

export default SMSModule;