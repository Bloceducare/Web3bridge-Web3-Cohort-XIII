import { ethers } from "hardhat";

async function main() {
  const [owner, user1, user2] = await ethers.getSigners();

  console.log("=== LootBox Demo ===");
  console.log("Owner:", owner.address);
  console.log("User1:", user1.address);

  console.log("\n=== Deploying Contracts ===");

  const CustomVRFCoordinatorFactory = await ethers.getContractFactory("CustomVRFCoordinator");
  const CustomVRFCoordinator = await CustomVRFCoordinatorFactory.deploy();
  console.log("CustomVRFCoordinator.sol deployed to:", await CustomVRFCoordinator.getAddress());

  const CustomERC20Factory = await ethers.getContractFactory("CustomERC20");
  const CustomERC20 = await CustomERC20Factory.deploy("Reward Token", "RWD", ethers.parseEther("1000000"));
  console.log("CustomERC20.sol deployed to:", await CustomERC20.getAddress());

  const CustomERC721Factory = await ethers.getContractFactory("CustomERC721");
  const CustomERC721 = await CustomERC721Factory.deploy("Reward NFT", "RNFT");
  console.log("CustomERC721.sol deployed to:", await CustomERC721.getAddress());

  const CustomERC1155Factory = await ethers.getContractFactory("CustomERC1155");
  const CustomERC1155 = await CustomERC1155Factory.deploy();
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
  console.log("LootBox deployed to:", await lootBox.getAddress());

  console.log("\n=== Setting Up Rewards ===");

  await CustomERC20.mint(await lootBox.getAddress(), ethers.parseEther("10000"));
  console.log("Minted ERC20 tokens to LootBox");

  await CustomERC721.mintBatch(await lootBox.getAddress(), 20);
  console.log("Minted 20 NFTs to LootBox");

  await CustomERC1155.mint(await lootBox.getAddress(), 1, 1000, "0x");
  await CustomERC1155.mint(await lootBox.getAddress(), 2, 100, "0x");
  await CustomERC1155.mint(await lootBox.getAddress(), 3, 10, "0x");
  console.log("Minted ERC1155 tokens to LootBox");

  await lootBox.addReward(0, await CustomERC20.getAddress(), 0, ethers.parseEther("10"), 600);
  await lootBox.addReward(0, await CustomERC20.getAddress(), 0, ethers.parseEther("50"), 200);
  await lootBox.addReward(1, await CustomERC721.getAddress(), 0, 1, 100);
  await lootBox.addReward(2, await CustomERC1155.getAddress(), 1, 5, 80);
  await lootBox.addReward(2, await CustomERC1155.getAddress(), 2, 2, 20);

  console.log("Added rewards to LootBox");
  console.log("Total rewards:", await lootBox.getRewardsCount());
  console.log("Total weight:", await lootBox.totalWeight());

  console.log("\n=== User Balances Before ===");
  console.log("User1 ETH:", ethers.formatEther(await ethers.provider.getBalance(user1.address)));
  console.log("User1 ERC20:", ethers.formatEther(await CustomERC20.balanceOf(user1.address)));
  console.log("User1 ERC721 count:", await CustomERC721.balanceOf(user1.address));
  console.log("User1 ERC1155 (ID 1):", await CustomERC1155.balanceOf(user1.address, 1));
  console.log("User1 ERC1155 (ID 2):", await CustomERC1155.balanceOf(user1.address, 2));

  console.log("\n=== Opening Loot Boxes ===");

  for (let i = 0; i < 5; i++) {
    console.log(`\nOpening box ${i + 1}...`);

    const tx = await lootBox.connect(user1).openBox({ value: BOX_PRICE });
    const receipt = await tx.wait();

    const boxPurchasedEvent = receipt!.logs.find(
      (log) => log.topics[0] === lootBox.interface.getEvent("BoxPurchased").topicHash
    );

    if (boxPurchasedEvent) {
      const parsedEvent = lootBox.interface.parseLog(boxPurchasedEvent)!;
      const requestId = parsedEvent.args.requestId;

      console.log(`Box purchased! RequestID: ${requestId}`);

      const randomNumber = await CustomVRFCoordinator.generateRandomNumber(i + Date.now());
      const fulfillTx = await CustomVRFCoordinator.fulfillRandomWords(requestId, [randomNumber]);
      const fulfillReceipt = await fulfillTx.wait();

      const boxOpenedEvent = fulfillReceipt!.logs.find(
        (log) => log.topics[0] === lootBox.interface.getEvent("BoxOpened").topicHash
      );

      if (boxOpenedEvent) {
        const openedEvent = lootBox.interface.parseLog(boxOpenedEvent)!;
        const rewardType = openedEvent.args.rewardType === 0n ? "ERC20" :
          openedEvent.args.rewardType === 1n ? "ERC721" : "ERC1155";
        const amount = openedEvent.args.amount;

        console.log(`🎉 Reward received: ${rewardType} - Amount: ${amount}`);
      }
    }

    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log("\n=== User Balances After ===");
  console.log("User1 ETH:", ethers.formatEther(await ethers.provider.getBalance(user1.address)));
  console.log("User1 ERC20:", ethers.formatEther(await CustomERC20.balanceOf(user1.address)));
  console.log("User1 ERC721 count:", await CustomERC721.balanceOf(user1.address));
  console.log("User1 ERC1155 (ID 1):", await CustomERC1155.balanceOf(user1.address, 1));
  console.log("User1 ERC1155 (ID 2):", await CustomERC1155.balanceOf(user1.address, 2));

  console.log("\n=== Contract Stats ===");
  console.log("Total boxes created:", await lootBox.totalBoxes());
  console.log("Total boxes sold:", await lootBox.boxesSold());
  console.log("Contract ETH balance:", ethers.formatEther(await ethers.provider.getBalance(await lootBox.getAddress())));

  console.log("\n=== Testing Administrative Functions ===");

  const newPrice = ethers.parseEther("0.15");
  await lootBox.setBoxPrice(newPrice);
  console.log("Updated box price to:", ethers.formatEther(await lootBox.boxPrice()), "ETH");

  const contractBalance = await ethers.provider.getBalance(await lootBox.getAddress());
  if (contractBalance > 0n) {
    await lootBox.withdrawFunds();
    console.log("Withdrew", ethers.formatEther(contractBalance), "ETH from contract");
  }

  console.log("\n=== Demo Complete ===");
  console.log("All LootBox functions have been tested successfully! 🎉");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
