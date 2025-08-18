// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

const EntryFee = 1_000_000_000_000_000_000n;

module.exports = buildModule("LotteryModule", (m) => {

  const entryFee = m.getParameter("entryFee", EntryFee);

  const lottery = m.contract("Lottery", [entryFee]);

  return { lottery };
});
