import { ethers } from "hardhat";

async function main() {
  console.log("Starting deployment...");

  try {
    // Deploy PiggyToken first with initial supply
    console.log("Deploying PiggyToken...");
    const PiggyToken = await ethers.getContractFactory("PiggyToken");
    const piggyToken = await PiggyToken.deploy(
      ethers.parseEther("1000000") // initial supply (1 million tokens)
    );
    await piggyToken.waitForDeployment();

    console.log("PiggyToken deployed to:", await piggyToken.getAddress());

    // Deploy PiggyFactory
    console.log("Deploying PiggyFactory...");
    const PiggyFactory = await ethers.getContractFactory("PiggyFactory");
    const piggyFactory = await PiggyFactory.deploy();
    await piggyFactory.waitForDeployment();

    console.log("PiggyFactory deployed to:", await piggyFactory.getAddress());

    // Optionally, create a Piggy contract through the factory
    console.log("Creating Piggy contract through factory...");
    const tokenAddress = await piggyToken.getAddress();
    const createPiggyTx = await piggyFactory.createPiggy(tokenAddress);
    await createPiggyTx.wait();

    const deployedPiggys = await piggyFactory.getDeployedPiggys();
    console.log("First Piggy contract created at:", deployedPiggys[0]);
  } catch (error) {
    console.error("Deployment failed:", error);
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
