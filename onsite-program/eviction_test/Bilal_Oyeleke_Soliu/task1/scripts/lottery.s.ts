const { ethers } = require("hardhat");

async function main() {
  const [owner, ...players] = await ethers.getSigners();
  const Lottery = await ethers.getContractFactory("Lottery");
  const entryFee = ethers.parseEther("0.1");
  const lottery = await Lottery.deploy(entryFee);

  console.log("Lottery deployed to:", await lottery.getAddress());

  // Simulate 2 full rounds
  for (let round = 1; round <= 2; round++) {
    console.log(`\n--- Round ${await lottery.currentRound()} ---`);
    for (let i = 0; i < 10; i++) {
      const tx = await lottery
        .connect(players[i])
        .join({ value: entryFee });
      await tx.wait();
      console.log(`Player ${i + 1} joined`);
    }
    console.log(`Winner selected for round ${round}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
