import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const LootBoxModule = buildModule("LootBoxModule", (m) => {
  // Deploy GameToken (ERC20)
  const gameToken = m.contract("GameToken");

  // Deploy GameNFT (ERC721)
  const gameNFT = m.contract("GameNFT");

  // Deploy GameItem (ERC1155)
  const gameItem = m.contract("GameItem");

  // Deploy MockVRFCoordinatorV2 (for local testing)
  const mockVRF = m.contract("MockVRFCoordinatorV2");

  // Deploy LootBox with constructor arguments
  const subscriptionId = 123; // Mock subscription ID for local testing
  const lootBox = m.contract("LootBox", [subscriptionId, gameToken, gameNFT, gameItem]);

  return { gameToken, gameNFT, gameItem, mockVRF, lootBox };
});

export default LootBoxModule;