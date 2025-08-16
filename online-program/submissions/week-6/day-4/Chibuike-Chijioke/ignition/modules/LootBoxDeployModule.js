const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("LootBoxDeployModule", (m) => {
  const vaultToken = m.contract("CustomERC20", [1_000_000]);

  const nftToken = m.contract("CustomERC721");

  const multiAsset = m.contract("CustomERC1155");

  const vrf = m.contract("SecurePseudoVRF");

  const lootBox = m.contract("LootBox", [
    vaultToken,
    nftToken,
    multiAsset,
    vrf,
  ]);

  return { vaultToken, nftToken, multiAsset, vrf, lootBox };
});
