import { ethers } from "hardhat";

async function main() {
  console.log("Deploying Lottery contract...");

  const LotteryFactory = await ethers.getContractFactory("Lottery");
  const lottery = await LotteryFactory.deploy();

  await lottery.deployed();
  const address = lottery.address;

  console.log(`Lottery contract deployed to: ${address}`);
  
  console.log("Contract details:");
  console.log(`- Entry fee: ${ethers.utils.formatEther(await lottery.ENTRY_FEE())} ETH`);
  console.log(`- Max players: ${await lottery.MAX_PLAYERS()}`);
  console.log(`- Current round: ${await lottery.getCurrentRound()}`);
  console.log(`- Current players: ${await lottery.getPlayerCount()}`);

  return address;
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

export default main;
