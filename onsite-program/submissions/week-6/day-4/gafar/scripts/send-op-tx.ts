import { ethers } from "ethers";
import * as hre from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  const vrfCoordinator = "0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625"; 
  const subscriptionId = process.env.VRF_SUBSCRIPTION_ID || "0";
  const keyHash = "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c"; 
  const lootBoxPrice = hre.ethers.parseEther("0.1"); 
  const weights = [50, 30, 20];

  const RewardERC20 = await hre.ethers.getContractFactory("RewardERC20");
  const rewardERC20 = await RewardERC20.deploy();
  await rewardERC20.waitForDeployment();
  console.log("RewardERC20 deployed to:", await rewardERC20.getAddress());

  const LootERC721 = await hre.ethers.getContractFactory("LootERC721");
  const lootERC721 = await LootERC721.deploy();
  await lootERC721.waitForDeployment();
  console.log("LootERC721 deployed to:", await lootERC721.getAddress());

  const LootERC1155 = await hre.ethers.getContractFactory("LootERC1155");
  const lootERC1155 = await LootERC1155.deploy();
  await lootERC1155.waitForDeployment();
  console.log("LootERC1155 deployed to:", await lootERC1155.getAddress());

  const LootBox = await hre.ethers.getContractFactory("LootBox");
  const lootBox = await LootBox.deploy(
    await rewardERC20.getAddress(),
    await lootERC721.getAddress(),
    await lootERC1155.getAddress(),
    lootBoxPrice,
    weights,
    vrfCoordinator,
    subscriptionId,
    keyHash
  );
  await lootBox.waitForDeployment();
  console.log("LootBox deployed to:", await lootBox.getAddress());

  await rewardERC20.transferOwnership(await lootBox.getAddress());
  console.log("RewardERC20 ownership transferred to LootBox");
  await lootERC721.transferOwnership(await lootBox.getAddress());
  console.log("LootERC721 ownership transferred to LootBox");
  await lootERC1155.transferOwnership(await lootBox.getAddress());
  console.log("LootERC1155 ownership transferred to LootBox");

  const lootBoxInfo = await lootBox.getLootBoxInfo();
  console.log("LootBox Info:", {
    id: lootBoxInfo.id.toString(),
    name: lootBoxInfo.name,
    description: lootBoxInfo.description,
    price: ethers.formatEther(lootBoxInfo.price),
    maxSupply: lootBoxInfo.maxSupply.toString(),
    currentSupply: lootBoxInfo.currentSupply.toString(),
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
