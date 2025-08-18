import { ethers } from "hardhat";

async function main() {
  console.log("Deploying Lottery Contract...");

  const LotteryFactory = await ethers.getContractFactory("Lottery");

  console.log("Deploying contract...");
  const lottery = await LotteryFactory.deploy();
  await lottery.waitForDeployment();

  const contractAddress = await lottery.getAddress();
  console.log(`Lottery contract deployed to: ${contractAddress}`);

  console.log("Contract Information:");
  console.log(`Entry Fee: ${ethers.formatEther(await lottery.ENTRY_FEE())} ETH`);
  console.log(`Max Players: ${await lottery.MAX_PLAYERS()}`);
  console.log(`Current Round: ${await lottery.lotteryRound()}`);
  console.log(`Current Players: ${await lottery.getPlayerCount()}`);
  console.log(`Prize Pool: ${ethers.formatEther(await lottery.getPrizePool())} ETH`);

  console.log("Deployment completed successfully!");
  console.log(`Contract Address: ${contractAddress}`);

  return contractAddress;
}

main()
  .then((address) => {
    console.log(`Save this address for interaction: ${address}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
