// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const DAOModule = buildModule("GovernanceDAOModule", (m) => {
  const daoft = m.contract("DAOMembershipNFT"); 

  const gateway = m.contract("TokenGateway", [daoft]);
  const dao = m.contract("GovernanceDAO", [gateway]);

  return { daoft, gateway, dao };
});


export default DAOModule;
