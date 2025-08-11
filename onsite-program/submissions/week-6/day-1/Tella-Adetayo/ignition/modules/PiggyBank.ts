import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const PiggyBankModule = buildModule("PiggyBankModule", (m) => {
  const owner = m.getParameter("owner", "0x2331B698eeE9bEaE834B06B6bDCb2DF94c9a01A3");

  const piggyBank = m.contract("PiggyBank", [owner]);

  return { piggyBank };
});

export default PiggyBankModule;
