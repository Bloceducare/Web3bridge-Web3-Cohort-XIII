import { ethers } from "hardhat";

async function main() {
  const [deployer, ...players] = await ethers.getSigners();

  console.log("Deploying contract with:", deployer.address);

  const Lottery = await ethers.getContractFactory("Lottery");
  const lottery = await Lottery.deploy();
  await lottery.waitForDeployment();

  console.log("Lottery deployed to:", await lottery.getAddress());

  const entryFee = await lottery.ENTRY_FEE();

  const balancesBefore: bigint[] = [];
  for (let i = 0; i < 10; i++) {
    balancesBefore[i] = await ethers.provider.getBalance(players[i].address);
  }

  console.log("--- Players Joining ---");
  for (let i = 0; i < 10; i++) {
    const tx = await lottery.connect(players[i]).joinLottery({ value: entryFee });
    await tx.wait();
    console.log(`Player ${i + 1} joined: ${players[i].address}`);
  }

  const winner = await lottery.getLastWinner();
  console.log(" Winner Selected:", winner);

  console.log("--- Balances After Lottery ---");
  for (let i = 0; i < 10; i++) {
    const balanceAfter = await ethers.provider.getBalance(players[i].address);
    const diff = balanceAfter - balancesBefore[i];
    console.log(
      `Player ${i + 1}: ${players[i].address}   Balance Change: ${ethers.formatEther(diff)} ETH`
    );
  }

  const prizePool = await lottery.getPrizePool();
  console.log("Final Prize Pool (should be 0):", ethers.formatEther(prizePool), "ETH");
  console.log("Current Lottery ID:", await lottery.getLotteryId());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
