// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";


const SchMSysModule = buildModule("SchMSysModule", (m) => {
  
  const schmsys = m.contract("SchMSys");

  return {schmsys };
});

export default SchMSysModule;
