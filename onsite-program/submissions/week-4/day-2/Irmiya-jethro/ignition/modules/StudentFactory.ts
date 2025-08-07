// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const StudentFactoryModule = buildModule("StudentFactoryModule", (m) => {


  const studentFactory = m.contract("StudentFactory");

  return { studentFactory };
});

export default StudentFactoryModule;
