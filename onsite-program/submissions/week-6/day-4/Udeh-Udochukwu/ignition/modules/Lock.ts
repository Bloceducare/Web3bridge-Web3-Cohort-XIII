const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

const LootBoxModule = buildModule("LootBoxModule", (m : any) => {
  // Deploy mock token contracts (for testing; replace with real addresses for production)
  const erc20Token = m.contract("MockERC20", [
    "Mock Token",
    "MTK",
    ethers.utils.parseEther("1000"),
  ]);
  const erc721Token = m.contract("MockERC721", ["Mock NFT", "MNFT"]);
  const erc1155Token = m.contract("MockERC1155", []);

  // Mock VRF Coordinator for local testing
  const vrfCoordinatorMock = m.contract("VRFCoordinatorV2Mock", [0, 0]);

  // Create and fund a VRF subscription
  const subscription = m.call(vrfCoordinatorMock, "createSubscription", []);
  const subscriptionId = m.getEventArgument(
    subscription,
    "SubscriptionCreated",
    "subId"
  );

  m.call(vrfCoordinatorMock, "fundSubscription", [
    subscriptionId,
    ethers.utils.parseEther("10"),
  ]);

  // Deploy LootBox with constructor arguments
  const lootBox = m.contract("LootBox", [
    subscriptionId,
    erc20Token,
    erc721Token,
    erc1155Token,
  ]);

  // Add LootBox as a consumer to the VRF subscription
  m.call(vrfCoordinatorMock, "addConsumer", [subscriptionId, lootBox]);

  // Fund LootBox with tokens for rewards
  m.call(erc20Token, "transfer", [lootBox, ethers.utils.parseEther("100")]);
  m.call(erc721Token, "mint", [lootBox, 1]); // Mint NFT with tokenId 1
  m.call(erc1155Token, "mint", [lootBox, 1, 5, "0x"]); // Mint 5 ERC1155 tokens with ID 1

  return { lootBox, erc20Token, erc721Token, erc1155Token, vrfCoordinatorMock };
});

module.exports = LootBoxModule;
