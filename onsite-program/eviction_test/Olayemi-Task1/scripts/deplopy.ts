import { ethers } from "hardhat";
import { Contract, Signer } from "ethers";

async function main() {
  const Lottery = await ethers.getContractFactory("Lottery");
  const lottery: Contract = await Lottery.deploy();
  await lottery.waitForDeployment();
  console.log("Lottery deployed to:", lottery.target);

  const [owner, ...players]: Signer[] = await ethers.getSigners();
  const entryFee: bigint = ethers.parseEther("0.01");

  console.log("\nRound 1:");
  
  for (let i = 0; i < 10; i++) {
    await lottery.connect(players[i]).joinLottery({ value: entryFee });
    console.log(`Player ${i + 1} (${await players[i].getAddress()}) joined`);
  }
  const winner: string = await lottery.winner();
  console.log("Winner:", winner);
  console.log(
    "Contract balance:",
    ethers.formatEther(await lottery.getBalance()),
    "ETH"
  );

 
  const winnerBalance: bigint = await ethers.provider.getBalance(winner);
  console.log("Winner's balance:", ethers.formatEther(winnerBalance), "ETH");

  console.log("\nRound 2:");
  await lottery.connect(players[0]).joinLottery({ value: entryFee });
  console.log(`Player 1 (${await players[0].getAddress()}) joined round 2`);
  console.log("Current players:", await lottery.getPlayers());
  console.log("Current round:", await lottery.round());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });