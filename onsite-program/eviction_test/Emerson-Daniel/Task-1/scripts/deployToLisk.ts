import { ethers } from "hardhat";

async function main() {
  console.log("Deploying Lottery contract to Lisk Sepolia...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.utils.formatEther(balance), "ETH");

  if (balance.lt(ethers.utils.parseEther("0.01"))) {
    throw new Error("Insufficient balance for deployment. Need at least 0.01 ETH for gas fees.");
  }
  
  const LotteryFactory = await ethers.getContractFactory("Lottery");
  
  console.log("Deploying contract...");
  const lottery = await LotteryFactory.deploy();
  
  console.log("Waiting for deployment confirmation...");
  await lottery.deployed();

  const contractAddress = lottery.address;
  console.log("✅ Lottery contract deployed successfully!");
  console.log("📍 Contract Address:", contractAddress);
  
  console.log("\n=== Contract Verification ===");
  console.log("Entry fee:", ethers.utils.formatEther(await lottery.ENTRY_FEE()), "ETH");
  console.log("Max players:", await lottery.MAX_PLAYERS());
  console.log("Current round:", await lottery.getCurrentRound());
  console.log("Current players:", await lottery.getPlayerCount());
  
  console.log("\n=== Next Steps ===");
  console.log("1. Verify the contract on Lisk Sepolia block explorer");
  console.log("2. Add the contract address to your README.md");
  console.log("3. Test the contract by calling enterLottery() with 0.02 ETH");
  
  console.log(`\n📋 Contract Address for README: ${contractAddress}`);
  
  return contractAddress;
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

export default main;
