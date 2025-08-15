import { network } from "hardhat";

const { ethers } = await network.connect({
  network: "sepolia",
  chainType: "l1",
});


async function main() {
  const vrfCoordinatorAddress = "0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625";
  const subscriptionId = "12459 ";
  const lootBoxAddress = "0xYOUR_DEPLOYED_LOOTBOX_ADDRESS"; 

  const VRFCoordinator = await ethers.getContractAt("VRFCoordinatorV2Interface", vrfCoordinatorAddress);
  const tx = await VRFCoordinator.addConsumer(subscriptionId, lootBoxAddress);
  await tx.wait();
  console.log("Added LootBox as consumer. Check at https://vrf.chain.link/");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});