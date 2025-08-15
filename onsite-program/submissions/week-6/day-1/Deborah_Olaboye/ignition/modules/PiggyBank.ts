import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const PiggyBankModule = buildModule("PiggyBankModule", (m) => {
  const piggy = m.contract("FactorySavings");

  return { piggy };
});

export default PiggyBankModule;
