// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const PiggyBankFactoryModule = buildModule("PiggyBankFactoryModule", (m) => {
    const _tokenAddress  = "0x647629202ce834Fc30f09138b2690b890f97eCA6";

 

  const PiggyBankFactory = m.contract("Token", [_tokenAddress]);
  return { PiggyBankFactory };
});

export default PiggyBankFactoryModule;

