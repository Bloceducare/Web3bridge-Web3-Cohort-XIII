import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const PiggyBankModule = buildModule("PiggyBankModule", (m) => {
  const bank = m.contract("PiggyBank");

  return { bank };
});

export default PiggyBankModule;
