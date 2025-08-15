import { network } from "hardhat";

const { ethers } = await network.connect({
  network: "sepolia",
  chainType: "l1",
});

async function main() {
  
  const [deployer] = await ethers.getSigners();

  console.log("Deploying with account:", deployer.address);

  
  const Subscription = await ethers.getContractFactory("MySubscriptionContract");
  const subscription = await Subscription.deploy();

  await subscription.waitForDeployment();

  console.log("Subscription contract deployed at:", await subscription.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
