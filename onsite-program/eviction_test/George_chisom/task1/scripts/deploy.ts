import { ethers } from "hardhat";

async function main() {
  console.log("Deploying Lottery Contract...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log(
    "Account balance:",
    ethers.formatEther(await ethers.provider.getBalance(deployer.address)),
    "ETH\n"
  );

  const LotteryFactory = await ethers.getContractFactory("Lottery");
  const lottery = await LotteryFactory.deploy();
  await lottery.waitForDeployment();

  const contractAddress = await lottery.getAddress();
  console.log("Lottery contract deployed to:", contractAddress);
  console.log("Initial lottery ID:", await lottery.lotteryId());
  console.log(
    "Entry fee:",
    ethers.formatEther(await lottery.ENTRY_FEE()),
    "ETH"
  );
  console.log("Max players:", await lottery.MAX_PLAYERS());

  console.log("\nContract Details:");
  console.log("   - Entry Fee: 0.01 ETH");
  console.log("   - Max Players: 10");
  console.log("   - Auto winner selection when full");
  console.log("   - Auto reset after each round");

  console.log("\nLottery contract ready for use!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
