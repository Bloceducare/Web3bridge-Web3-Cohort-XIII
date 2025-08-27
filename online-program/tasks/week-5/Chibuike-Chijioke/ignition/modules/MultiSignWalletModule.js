const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("MultiSignWalletModule", (m) => {
  const owner1 = m.getAccount(0);
  //   const owner2 = m.getAccount(1);
  //   const owner3 = m.getAccount(2);
  const requiredConfirmations = 1;

  const multiSignWallet = m.contract("MultiSignWallet", [
    [owner1],
    requiredConfirmations,
  ]);

  return { multiSignWallet };
});
