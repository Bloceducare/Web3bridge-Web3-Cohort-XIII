import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { network } from "hardhat";

const { ethers } = await network.connect({
  network: "sepolia",
  chainType: "l1",
});

export default buildModule("LootBoxModule", (m) => {
  const boxFee = ethers.parseEther("0.1");
  const vrfCoordinator = "0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625";
  const keyHash = "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c";
  const subscriptionId = 12459n; // Updated to bigint

  const erc20Mock = m.contract("ERC20Mock", ["TestERC20", "T20"]);
  const erc721Mock = m.contract("ERC721Mock", ["TestNFT", "TNFT"]);
  const erc1155Mock = m.contract("ERC1155Mock", ["https://gateway.pinata.cloud/ipfs/bafkreicri55xmgwj7235hy4yeakbsyt2ne2s2txahidxppyg4r5zztwyg4/{id}.json"]);
  const lootBox = m.contract("LootBox", [boxFee, vrfCoordinator, keyHash, subscriptionId]);

  m.call(erc20Mock, "mint", [lootBox, 1000], { id: "mint_erc20" });
  m.call(erc721Mock, "mint", [lootBox, 1], { id: "mint_erc721" });
  m.call(erc1155Mock, "mint", [lootBox, 1, 5, "0x"], { id: "mint_erc1155" });

  m.call(lootBox, "addReward", [0, erc20Mock, 100, 70], { id: "add_reward_erc20" });
  m.call(lootBox, "addReward", [1, erc721Mock, 1, 20], { id: "add_reward_erc721" });
  m.call(lootBox, "addReward", [2, erc1155Mock, 1, 10], { id: "add_reward_erc1155" });

  return { lootBox, erc20Mock, erc721Mock, erc1155Mock };
});