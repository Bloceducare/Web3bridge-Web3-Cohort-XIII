import { ethers } from "hardhat";
import hre from "hardhat";

async function main() {
  const [deployer, ...players] = await ethers.getSigners();
  const ENTRY_FEE = hre.ethers.parseEther("0.01");
  const MAX_PLAYERS = 10;

  console.log("Running interaction script...");

  // 1. Deploy contract
  const Lottery = await ethers.getContractFactory("Lottery");
  const lottery = await Lottery.deploy();
  await lottery.waitForDeployment();
  console.log(`Lottery deployed to: ${await lottery.getAddress()}`);

  // 2. Have 10 players enter
  console.log("\nAdding players to lottery...");
  for (let i = 0; i < MAX_PLAYERS; i++) {
    const tx = await lottery.connect(players[i]).enter({ value: ENTRY_FEE });
    await tx.wait();
    console.log(`Player ${i + 1} (${players[i].address}) entered`);
  }

  // 3. Check winner
  const winner = await lottery.getLastWinner();
  console.log(`\nWinner selected: ${winner}`);
  console.log(`Prize amount: ${hre.ethers.formatEther(await lottery.getPrizePool())} ETH`);

  // 4. Check round reset
  console.log(`\nCurrent round: ${await lottery.getCurrentRound()}`);
  console.log(`Players in new round: ${(await lottery.getPlayers()).length}`);

  // 5. Enter new player in next round
  await lottery.connect(players[MAX_PLAYERS]).enter({ value: ENTRY_FEE });
  console.log(`\nNew player entered in round ${await lottery.getCurrentRound()}`);
  console.log(`Current players: ${(await lottery.getPlayers()).length}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });