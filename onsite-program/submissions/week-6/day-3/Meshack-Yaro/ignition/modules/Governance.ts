// This setup uses Hardhat Ignition to manage smart contract deployments. 
// Learn more about it at https://hardhat.org/ignition
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const GovernanceModule = buildModule("GovernanceModule", (m) => {
  const daoMemberNFT = m.contract("DAOMemberNFT", []);

  const roleRegistry = m.contract("RoleRegistry", []);

  const governance = m.contract("Governance", [
    daoMemberNFT,
    roleRegistry
  ]);

  return { daoMemberNFT, roleRegistry, governance };
});

export default GovernanceModule;
