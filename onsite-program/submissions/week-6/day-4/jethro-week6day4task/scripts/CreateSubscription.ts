import { network } from "hardhat";

const { ethers } = await network.connect({
  network: "sepolia",
  chainType: "l1",
});

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Using account:", deployer.address);

  
  const vrfCoordinatorAddress = "0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625";
  const vrfCoordinatorAbi = [
    "function createSubscription() public returns (uint64)"
  ];

  const vrf = new ethers.Contract(vrfCoordinatorAddress, vrfCoordinatorAbi, deployer);

  const tx = await vrf.createSubscription();
  const receipt = await tx.wait();
  console.log("Subscription created in tx:", receipt.id);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
