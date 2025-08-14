import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { ethers } from "hardhat";

module.exports = buildModule("LootBoxModule", (m) => {
  const vrfCoordinator = "0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625"; 
  const subscriptionId = process.env.VRF_SUBSCRIPTION_ID || "0"; 
  const keyHash = "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c";
  const lootBoxPrice = ethers.parseEther("0.1");
  const weights = [50, 30, 20];

  const rewardERC20 = m.contract("RewardERC20", [], {
    id: "RewardERC20",
  });

  const lootERC721 = m.contract("LootERC721", [], {
    id: "LootERC721",
  });

  const lootERC1155 = m.contract("LootERC1155", [], {
    id: "LootERC1155",
  });

  const lootBox = m.contract(
    "LootBox",
    [
      rewardERC20,
      lootERC721,
      lootERC1155,
      lootBoxPrice,
      weights,
      vrfCoordinator,
      subscriptionId,
      keyHash,
    ],
    {
      id: "LootBox",
      after: [rewardERC20, lootERC721, lootERC1155],
    }
  );

  m.call(rewardERC20, "transferOwnership", [lootBox], {
    id: "TransferOwnershipRewardERC20",
    after: [lootBox],
  });

  m.call(lootERC721, "transferOwnership", [lootBox], {
    id: "TransferOwnershipLootERC721",
    after: [lootBox],
  });

  m.call(lootERC1155, "transferOwnership", [lootBox], {
    id: "TransferOwnershipLootERC1155",
    after: [lootBox],
  });

  return { rewardERC20, lootERC721, lootERC1155, lootBox };
});
