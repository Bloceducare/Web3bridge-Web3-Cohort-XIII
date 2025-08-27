const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("PiggyBankFactoryModule", (m) => {
  const factory = m.contract("PiggyBankFactory");

  return { factory };
});
