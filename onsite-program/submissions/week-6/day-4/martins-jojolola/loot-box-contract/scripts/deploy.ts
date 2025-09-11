import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  const CustomVRFCoordinatorFactory = await ethers.getContractFactory("CustomVRFCoordinator");
  const CustomVRFCoordinator = await CustomVRFCoordinatorFactory.deploy();
  await CustomVRFCoordinator.waitForDeployment();
  console.log("CustomVRFCoordinator.sol deployed to:", await CustomVRFCoordinator.getAddress());

  const CustomERC20Factory = await ethers.getContractFactory("CustomERC20");
  const CustomERC20 = await CustomERC20Factory.deploy("Reward Token", "RWD", ethers.parseEther("1000000"));
  await CustomERC20.waitForDeployment();
  console.log("CustomERC20.sol deployed to:", await CustomERC20.getAddress());

  const CustomERC721Factory = await ethers.getContractFactory("CustomERC721");
  const CustomERC721 = await CustomERC721Factory.deploy("Reward NFT", "RNFT");
  await CustomERC721.waitForDeployment();
  console.log("CustomERC721.sol deployed to:", await CustomERC721.getAddress());

  const CustomERC1155Factory = await ethers.getContractFactory("CustomERC1155");
  const CustomERC1155 = await CustomERC1155Factory.deploy();
  await CustomERC1155.waitForDeployment();
  console.log("CustomERC1155.sol deployed to:", await CustomERC1155.getAddress());

  const BOX_PRICE = ethers.parseEther("0.1");
  const SUBSCRIPTION_ID = 1;
  const KEY_HASH = "0x0000000000000000000000000000000000000000000000000000000000000000";

  const LootBoxFactory = await ethers.getContractFactory("LootBox");
  const lootBox = await LootBoxFactory.deploy(
    SUBSCRIPTION_ID,
    await CustomVRFCoordinator.getAddress(),
    KEY_HASH,
    BOX_PRICE
  );
  await lootBox.waitForDeployment();
  console.log("LootBox deployed to:", await lootBox.getAddress());

  console.log("\nSetting up rewards...");
  
  const rewardTokens = ethers.parseEther("10000");
  await CustomERC20.mint(await lootBox.getAddress(), rewardTokens);
  console.log("Minted", ethers.formatEther(rewardTokens), "ERC20 tokens to LootBox");

  const nftIds = await CustomERC721.mintBatch(await lootBox.getAddress(), 20);
  console.log("Minted 20 NFTs to LootBox");

  await CustomERC1155.mint(await lootBox.getAddress(), 1, 1000, "0x"); 
  await CustomERC1155.mint(await lootBox.getAddress(), 2, 100, "0x"); 
  await CustomERC1155.mint(await lootBox.getAddress(), 3, 10, "0x");  
  console.log("Minted ERC1155 tokens to LootBox");

  
  await lootBox.addReward(
    0, 
    await CustomERC20.getAddress(),
    0,
    ethers.parseEther("10"),
    600 
  );
  console.log("Added ERC20 reward (common): 10 tokens, 60% chance");

  await lootBox.addReward(
    0, 
    await CustomERC20.getAddress(),
    0,
    ethers.parseEther("50"), 
    200 
  );
  console.log("Added ERC20 reward (rare): 50 tokens, 20% chance");

  for (let i = 0; i < 5; i++) {
    await lootBox.addReward(
      1, 
      await CustomERC721.getAddress(),
      i,
      1,
      20 
    );
  }
  console.log("Added 5 ERC721 rewards: 2% chance each");

  await lootBox.addReward(
    2, 
    await CustomERC1155.getAddress(),
    1, 
    5,
    80 
  );
  console.log("Added ERC1155 reward (common): 5 items, 8% chance");

  await lootBox.addReward(
    2, 
    await CustomERC1155.getAddress(),
    2, 
    2,
    30 
  );
  console.log("Added ERC1155 reward (rare): 2 items, 3% chance");

  await lootBox.addReward(
    2, 
    await CustomERC1155.getAddress(),
    3, 
    1,
    10 
  );
  console.log("Added ERC1155 reward (epic): 1 item, 1% chance");

  console.log("\n=== Deployment Summary ===");
  console.log("CustomVRFCoordinator.sol:", await CustomVRFCoordinator.getAddress());
  console.log("CustomERC20.sol:", await CustomERC20.getAddress());
  console.log("CustomERC721.sol:", await CustomERC721.getAddress());
  console.log("CustomERC1155.sol:", await CustomERC1155.getAddress());
  console.log("LootBox:", await lootBox.getAddress());
  console.log("Box Price:", ethers.formatEther(BOX_PRICE), "ETH");
  console.log("Total Rewards:", await lootBox.getRewardsCount());
  console.log("Total Weight:", await lootBox.totalWeight());

  const fs = require('fs');
  const deploymentInfo = {
    lootBox: await lootBox.getAddress(),
    CustomVRFCoordinator: await CustomVRFCoordinator.getAddress(),
    CustomERC20: await CustomERC20.getAddress(),
    CustomERC721: await CustomERC721.getAddress(),
    CustomERC1155: await CustomERC1155.getAddress(),
    boxPrice: BOX_PRICE.toString(),
    deployer: deployer.address
  };
  
  fs.writeFileSync('deployment-info.json', JSON.stringify(deploymentInfo, null, 2));
  console.log("\nDeployment info saved to deployment-info.json");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
