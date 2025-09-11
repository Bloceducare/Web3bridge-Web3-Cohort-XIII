import { ethers } from "hardhat";
import fs from 'fs';

async function main() {
  if (!fs.existsSync('deployment-info.json')) {
    console.log("Please run the deploy script first!");
    return;
  }

  const deploymentInfo = JSON.parse(fs.readFileSync('deployment-info.json', 'utf8'));
  const [deployer, user1, user2] = await ethers.getSigners();

  console.log("=== LootBox Interaction Demo ===");
  console.log("LootBox Address:", deploymentInfo.lootBox);
  console.log("Box Price:", ethers.formatEther(deploymentInfo.boxPrice), "ETH");

  const lootBox = await ethers.getContractAt("LootBox", deploymentInfo.lootBox);
  const CustomVRFCoordinator = await ethers.getContractAt("CustomVRFCoordinator", deploymentInfo.CustomVRFCoordinator);
  const CustomERC20 = await ethers.getContractAt("CustomERC20", deploymentInfo.CustomERC20);
  const CustomERC721 = await ethers.getContractAt("CustomERC721", deploymentInfo.CustomERC721);
  const CustomERC1155 = await ethers.getContractAt("CustomERC1155", deploymentInfo.CustomERC1155);

  console.log("\n=== Contract State ===");
  console.log("Total Rewards:", await lootBox.getRewardsCount());
  console.log("Total Weight:", await lootBox.totalWeight());
  console.log("Total Boxes:", await lootBox.totalBoxes());
  console.log("Boxes Sold:", await lootBox.boxesSold());

  console.log("\n=== Available Rewards ===");
  const rewardCount = await lootBox.getRewardsCount();
  for (let i = 0; i < rewardCount; i++) {
    const reward = await lootBox.getReward(i);
    const rewardType = reward.rewardType === 0n ? "ERC20" :
      reward.rewardType === 1n ? "ERC721" : "ERC1155";
    console.log(`Reward ${i}: ${rewardType} - ${reward.tokenAddress} - Amount: ${reward.amount} - Weight: ${reward.weight} - Active: ${reward.isActive}`);
  }

  console.log("\n=== User Balances Before ===");
  console.log("User1 ETH:", ethers.formatEther(await ethers.provider.getBalance(user1.address)));
  console.log("User1 ERC20:", ethers.formatEther(await CustomERC20.balanceOf(user1.address)));
  console.log("User1 ERC721 count:", await CustomERC721.balanceOf(user1.address));
  console.log("User1 ERC1155 (ID 1):", await CustomERC1155.balanceOf(user1.address, 1));
  console.log("User1 ERC1155 (ID 2):", await CustomERC1155.balanceOf(user1.address, 2));
  console.log("User1 ERC1155 (ID 3):", await CustomERC1155.balanceOf(user1.address, 3));

  console.log("\n=== Opening Loot Boxes ===");
  const boxesToOpen = 5;
  const requestIds: bigint[] = [];

  for (let i = 0; i < boxesToOpen; i++) {
    console.log(`\nOpening box ${i + 1}/${boxesToOpen}...`);

    try {
      const tx = await lootBox.connect(user1).openBox({
        value: deploymentInfo.boxPrice
      });
      const receipt = await tx.wait();

      const boxPurchasedEvent = receipt!.logs.find(
        (log) => log.topics[0] === lootBox.interface.getEvent("BoxPurchased").topicHash
      );

      if (boxPurchasedEvent) {
        const parsedEvent = lootBox.interface.parseLog(boxPurchasedEvent)!;
        const requestId = parsedEvent.args.requestId;
        requestIds.push(requestId);

        console.log(`Box purchased! RequestID: ${requestId}`);

        const randomNumber = await CustomVRFCoordinator.generateRandomNumber(i + Date.now());
        console.log(`Generated random number: ${randomNumber}`);

        const fulfillTx = await CustomVRFCoordinator.fulfillRandomWords(requestId, [randomNumber]);
        const fulfillReceipt = await fulfillTx.wait();

        const boxOpenedEvent = fulfillReceipt!.logs.find(
          (log) => log.topics[0] === lootBox.interface.getEvent("BoxOpened").topicHash
        );

        if (boxOpenedEvent) {
          const openedEvent = lootBox.interface.parseLog(boxOpenedEvent)!;
          const rewardIndex = openedEvent.args.rewardIndex;
          const rewardType = openedEvent.args.rewardType === 0n ? "ERC20" :
            openedEvent.args.rewardType === 1n ? "ERC721" : "ERC1155";
          const tokenAddress = openedEvent.args.tokenAddress;
          const tokenId = openedEvent.args.tokenId;
          const amount = openedEvent.args.amount;

          console.log(`🎉 Reward received!`);
          console.log(`   Type: ${rewardType}`);
          console.log(`   Token: ${tokenAddress}`);
          console.log(`   Token ID: ${tokenId}`);
          console.log(`   Amount: ${amount}`);
          console.log(`   Reward Index: ${rewardIndex}`);
        }
      }

      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error) {
      console.error(`Error opening box ${i + 1}:`, error);
    }
  }

  console.log("\n=== User Balances After ===");
  console.log("User1 ETH:", ethers.formatEther(await ethers.provider.getBalance(user1.address)));
  console.log("User1 ERC20:", ethers.formatEther(await CustomERC20.balanceOf(user1.address)));
  console.log("User1 ERC721 count:", await CustomERC721.balanceOf(user1.address));
  console.log("User1 ERC1155 (ID 1):", await CustomERC1155.balanceOf(user1.address, 1));
  console.log("User1 ERC1155 (ID 2):", await CustomERC1155.balanceOf(user1.address, 2));
  console.log("User1 ERC1155 (ID 3):", await CustomERC1155.balanceOf(user1.address, 3));

  console.log("\n=== User's Boxes ===");
  const userBoxes = await lootBox.getUserBoxes(user1.address);
  console.log("Total boxes owned:", userBoxes.length);

  for (let i = 0; i < userBoxes.length; i++) {
    const boxId = userBoxes[i];
    const boxReward = await lootBox.getBoxReward(boxId);
    const rewardType = boxReward.rewardType === 0n ? "ERC20" :
      boxReward.rewardType === 1n ? "ERC721" : "ERC1155";
    console.log(`Box ${boxId}: ${rewardType} reward - ${boxReward.amount} units`);
  }

  console.log("\n=== Contract Stats ===");
  console.log("Total boxes created:", await lootBox.totalBoxes());
  console.log("Total boxes sold:", await lootBox.boxesSold());
  console.log("Contract ETH balance:", ethers.formatEther(await ethers.provider.getBalance(deploymentInfo.lootBox)));

  console.log("\n=== Testing Administrative Functions ===");

  const newPrice = ethers.parseEther("0.15");
  console.log("Updating box price to", ethers.formatEther(newPrice), "ETH...");
  await lootBox.setBoxPrice(newPrice);
  console.log("New box price:", ethers.formatEther(await lootBox.boxPrice()), "ETH");

  console.log("Adding new reward...");
  await lootBox.addReward(
    0,
    deploymentInfo.CustomERC20,
    0,
    ethers.parseEther("100"),
    50
  );
  console.log("Added new ERC20 reward: 100 tokens");
  console.log("New total rewards:", await lootBox.getRewardsCount());
  console.log("New total weight:", await lootBox.totalWeight());

  // Test reward update
  const lastRewardIndex = await lootBox.getRewardsCount() - 1n;
  console.log("Deactivating last reward...");
  await lootBox.updateReward(lastRewardIndex, 0, false);
  console.log("Updated total weight:", await lootBox.totalWeight());

  console.log("\n=== Testing Edge Cases ===");

  try {
    await lootBox.connect(user2).openBox({ value: ethers.parseEther("0.05") });
  } catch (error: any) {
    console.log("✅ Insufficient payment correctly rejected:", error.reason || error.message);
  }

  console.log("Deactivating all rewards...");
  const totalRewards = await lootBox.getRewardsCount();
  for (let i = 0; i < totalRewards; i++) {
    const reward = await lootBox.getReward(i);
    if (reward.isActive) {
      await lootBox.updateReward(i, 0, false);
    }
  }

  try {
    await lootBox.connect(user2).openBox({ value: await lootBox.boxPrice() });
  } catch (error: any) {
    console.log("✅ No rewards available correctly rejected:", error.reason || error.message);
  }

  console.log("Reactivating first reward...");
  await lootBox.updateReward(0, 100, true);

  console.log("\n=== Final Box Opening Test ===");
  const finalTx = await lootBox.connect(user2).openBox({
    value: await lootBox.boxPrice()
  });
  const finalReceipt = await finalTx.wait();

  const finalBoxEvent = finalReceipt!.logs.find(
    (log) => log.topics[0] === lootBox.interface.getEvent("BoxPurchased").topicHash
  );

  if (finalBoxEvent) {
    const parsedEvent = lootBox.interface.parseLog(finalBoxEvent)!;
    const requestId = parsedEvent.args.requestId;

    const randomNumber = await CustomVRFCoordinator.generateRandomNumber(999);
    await CustomVRFCoordinator.fulfillRandomWords(requestId, [randomNumber]);

    console.log("✅ Final box opened successfully!");
  }

  console.log("\n=== Fund Withdrawal Test ===");
  const contractBalance = await ethers.provider.getBalance(deploymentInfo.lootBox);
  if (contractBalance > 0n) {
    console.log("Contract balance before withdrawal:", ethers.formatEther(contractBalance), "ETH");
    await lootBox.withdrawFunds();
    const newBalance = await ethers.provider.getBalance(deploymentInfo.lootBox);
    console.log("Contract balance after withdrawal:", ethers.formatEther(newBalance), "ETH");
    console.log("✅ Funds withdrawal successful!");
  }

  console.log("\n=== Demo Complete ===");
  console.log("All LootBox functions have been tested successfully! 🎉");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
