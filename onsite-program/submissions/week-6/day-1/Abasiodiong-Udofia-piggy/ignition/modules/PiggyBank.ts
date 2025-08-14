// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

// const JAN_1ST_2030 = 1893456000;
// const ONE_GWEI: bigint = 1_000_000_000n;

const PiggyBankModule = buildModule("PiggyBankModule", (m) => {
  // const unlockTime = m.getParameter("unlockTime", JAN_1ST_2030);
  // const lockedAmount = m.getParameter("lockedAmount", ONE_GWEI);

  // const piggyBank = m.contract("PiggyBank");
  // const lock = m.contract("Lock", [unlockTime], {
  //   value: lockedAmount,
  // });

  const factory = m.contract("PiggyBankFactory");
  const mockERC20 = m.contract("MockERC20");

  return { factory, mockERC20 };
});

export default PiggyBankModule;
