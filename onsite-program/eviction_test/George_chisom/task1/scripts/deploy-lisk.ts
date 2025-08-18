import { ethers } from "hardhat";

async function main() {
  console.log("Deploying Lottery Contract to Lisk Sepolia...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log(
    "Account balance:",
    ethers.formatEther(await ethers.provider.getBalance(deployer.address)),
    "ETH\n"
  );

  console.log("Deploying Lottery contract...");
  const LotteryFactory = await ethers.getContractFactory("Lottery");
  const lottery = await LotteryFactory.deploy();
  
  console.log("Waiting for deployment...");
  await lottery.waitForDeployment();

  const contractAddress = await lottery.getAddress();
  console.log("SUCCESS: Lottery contract deployed to:", contractAddress);
  console.log("Initial lottery ID:", await lottery.lotteryId());
  console.log("Entry fee:", ethers.formatEther(await lottery.ENTRY_FEE()), "ETH");
  console.log("Max players:", await lottery.MAX_PLAYERS());

  console.log("\nContract Details:");
  console.log("   - Network: Lisk Sepolia");
  console.log("   - Contract Address:", contractAddress);
  console.log("   - Entry Fee: 0.01 ETH");
  console.log("   - Max Players: 10");
  console.log("   - Auto winner selection when full");
  console.log("   - Auto reset after each round");

  console.log("\nVerification Command:");
  console.log(`npx hardhat verify --network lisk ${contractAddress}`);
  
  console.log("\nLottery contract deployed and ready for use on Lisk Sepolia!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
