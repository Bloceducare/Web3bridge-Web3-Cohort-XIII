import { ethers } from "hardhat";

async function main() {
  const [deployer, user] = await ethers.getSigners();

  const VRFMock = await ethers.getContractFactory("VRFCoordinatorV2PlusMock");
  const vrfMock = await VRFMock.deploy(ethers.parseEther("0.000000001"), ethers.parseEther("0.000000001"));
  await vrfMock.waitForDeployment();
  const subId = await vrfMock.createSubscription();
  await vrfMock.fundSubscription(subId, ethers.parseEther("10"));

  const LootBox = await ethers.getContractFactory("LootBox");
  const lootBox = await LootBox.deploy(
    await vrfMock.getAddress(),
    "0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae",
    subId,
    ethers.parseEther("0.1")
  );
  await lootBox.waitForDeployment();
  console.log("LootBox deployed to:", await lootBox.getAddress());

  
  await vrfMock.addConsumer(subId, await lootBox.getAddress());

  
  await lootBox.addReward(0, ZeroAddress, 100, 50); 

 
  const tx = await lootBox.connect(user).openBox({ value: ethers.parseEther("0.1") });
  const receipt = await tx.wait();
  const requestId = receipt.logs.find((log: any) => log.fragment.name === "BoxOpened")?.args.requestId;
  console.log("Box opened, requestId:", requestId);

 await vrfMock.fulfillRandomWords(requestId, await lootBox.getAddress(), [12345]);
  console.log("Randomness fulfilled");

   await lootBox.withdrawFees();
  console.log("Fees withdrawn");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});