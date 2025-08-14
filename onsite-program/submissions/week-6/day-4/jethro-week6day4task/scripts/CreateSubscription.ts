import { ethers } from "hardhat";

async function main() {
  const vrfCoordinatorAddress = "0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625";
  const VRFCoordinator = await ethers.getContractAt("VRFCoordinatorV2Interface", vrfCoordinatorAddress);
  const tx = await VRFCoordinator.createSubscription();
  const receipt = await tx.wait();
  const subscriptionId = receipt?.logs[0].args[0]; // subId
  console.log("Subscription ID:", subscriptionId.toString());
  // Note this down for deploy.ts and fundSubscription.ts
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});