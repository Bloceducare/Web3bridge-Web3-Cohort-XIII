import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const LootBoxModule = buildModule("LootBoxModule", (m) => {
  // Deploy GameToken (ERC20)
  const gameToken = m.contract("GameToken");

  // Deploy GameNFT (ERC721)
  const gameNFT = m.contract("GameNFT");

  // Deploy GameItem (ERC1155)
  const gameItem = m.contract("GameItem");

  // Deploy MockVRFCoordinatorV2 (for local testing)
  // const mockVRF = m.contract("MockVRFCoordinatorV2");

  // Deploy LootBox with constructor arguments
  const subscriptionId = 101100465632379702794377097390851483871355491715241812813078601518800015702776; // Mock subscription ID for local testing
  const lootBox = m.contract("LootBox", [
    subscriptionId,
    gameToken,
    gameNFT,
    gameItem,
  ]);

  return { gameToken, gameNFT, gameItem, lootBox };
});

export default LootBoxModule;
//88cce449dd8ad6b3c2f6861b84888c316e0868d9a1ee3acbd09b2c58cfa7b46c

// "npx hardhat vars set PRIVATE_KEY",
//     "npx hardhat ignition deploy ignition/modules/Lock.ts --network liskTestnet --verify",
