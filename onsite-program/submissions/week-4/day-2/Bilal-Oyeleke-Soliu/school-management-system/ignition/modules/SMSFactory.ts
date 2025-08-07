// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";


const SMSFactoryModule = buildModule("SMSFactoryModule", (m) => {

  const smsFatory = m.contract("SMSFactory");

  return { smsFatory };
});

export default SMSFactoryModule;
