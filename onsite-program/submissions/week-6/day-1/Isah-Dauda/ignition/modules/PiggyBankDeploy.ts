import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const DeployPiggyBankFactoryModule = buildModule("DeployPiggyBankFactoryModule", (m) => {
  
  const PiggyBankFactory = m.contract("PiggyBankFactory");


  return { PiggyBankFactory };
});

export default DeployPiggyBankFactoryModule;