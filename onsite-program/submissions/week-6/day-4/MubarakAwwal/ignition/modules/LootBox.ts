const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("LootBoxModule", (m) => {
  // Deploy mocks
  const erc20 = m.contract("MockERC20", ["MockToken", "MTK"]);
  const erc721 = m.contract("MockERC721", ["MockNFT", "MNFT"]);
  const erc1155 = m.contract("MockERC1155");

  // Deploy fake RNG
  const rng = m.contract("RandomGenerator");

  // Fee for opening a lootbox
  const fee = m.getParameter("fee", ethers.parseEther("1"));

  // Deploy LootBox
  const lootBox = m.contract("LootBox", [rng, fee]);

  return { erc20, erc721, erc1155, rng, lootBox };
});
