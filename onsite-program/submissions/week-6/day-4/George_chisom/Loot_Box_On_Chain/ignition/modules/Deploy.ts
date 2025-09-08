import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { network } from "hardhat";

const { ethers } = await network.connect({
  network: "sepolia",
  chainType: "l1",
});

export default buildModule("LootBoxModule", (m) => {
  const boxFee = ethers.parseEther("0.1");
  //   const vrfCoordinator = "0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625";
  //   const keyHash =
  //     "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c";
  //   const subscriptionId = "12459";

  const erc20Mock = m.contract("LootBoxERC20Token", [1000]);
  const erc721Mock = m.contract("RewardERC721");
  const erc1155Mock = m.contract("RewardERC1155"); // m.contract("RewardERC1155", ["argument1", "argument2 that the constructor need"]);
  const lootBox = m.contract("LootBox", [
    boxFee,
    // vrfCoordinator,
    // keyHash,
    // subscriptionId,
  ]);

  m.call(erc20Mock, "transferReward", [lootBox, 1000], { id: "mint_erc20" });
  m.call(erc721Mock, "safeMint", [lootBox, 1], { id: "mint_erc721" });
  m.call(erc1155Mock, "transferRewards", [lootBox, 1, 5, "0x"], {
    id: "mint_erc1155",
  });

  m.call(lootBox, "add_rewards", [0, erc20Mock, 100, 70], {
    id: "add_reward_erc20",
  });
  m.call(lootBox, "UpdateBoxOpenFee", [1, erc721Mock, 1, 20], {
    id: "add_reward_erc721",
  });
  m.call(lootBox, "PayForLootBox", [2, erc1155Mock, 1, 10], {
    id: "add_reward_erc1155",
  });
  m.call(lootBox, "distributeReward", [2, erc1155Mock, 1, 10], {
    id: "add_reward_erc1155",
  });

  return { lootBox, erc20Mock, erc721Mock, erc1155Mock };
});
