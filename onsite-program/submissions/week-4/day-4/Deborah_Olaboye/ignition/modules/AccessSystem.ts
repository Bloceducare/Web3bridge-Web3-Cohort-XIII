// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";


const AccessSystemModule = buildModule("AccessSystemModule", (m) => {
  const access_system = m.contract("AccessSystem");

  return { access_system };
});

export default AccessSystemModule;
