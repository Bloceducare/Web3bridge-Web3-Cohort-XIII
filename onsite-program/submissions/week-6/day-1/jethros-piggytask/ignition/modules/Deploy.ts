import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("PiggyBankFactoryModule", (m) => {
  // Deploy the PiggyBankFactory
  const piggyBankFactory = m.contract("PiggyBankFactory");

  return { piggyBankFactory };
});
