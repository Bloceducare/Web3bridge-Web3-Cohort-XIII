import { ethers } from "hardhat";

async function main() {
  // For Sepolia: Use actual values
  const vrfCoordinator = "0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625";
  const subscriptionId = 0; // Replace with your subscription ID
  const keyHash = "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c";
  const fee = ethers.parseEther("0.1");

  const LootBox = await ethers.getContractFactory("LootBox");
  const lootBox = await LootBox.deploy(vrfCoordinator, subscriptionId, keyHash, fee);
  await lootBox.waitForDeployment();
  console.log("LootBox deployed to:", await lootBox.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});



