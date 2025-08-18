import { ethers } from "hardhat";

async function main() {
  const accounts = await ethers.getSigners();
  const Lottery = await ethers.getContractFactory("Lottery");
  const lottery = await Lottery.deploy();
  console.log("Lottery deployed to:", await lottery.getAddress());

  for (let i = 1; i <= 10; i++) {
    const tx = await lottery
      .connect(accounts[i])
      .enter({ value: ethers.parseEther("0.01") });
    await tx.wait();
    console.log(`Player ${i} entered:`, accounts[i].address);
  }

  const winner = await lottery.winner();
  console.log("Winner:", winner);
  const winnerBalance = await ethers.provider.getBalance(winner);
  console.log("Winner balance:", ethers.formatEther(winnerBalance));

  for (let i = 1; i <= 10; i++) {
    const tx = await lottery
      .connect(accounts[i])
      .enter({ value: ethers.parseEther("0.01") });
    await tx.wait();
  }
  const winner2 = await lottery.winner();
  console.log("Next round winner:", winner2);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
