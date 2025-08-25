const { ethers } = require("hardhat");

async function main() {
  const [deployer, ...accounts] = await ethers.getSigners();

  console.log("Deploying with account:", await deployer.getAddress());
  console.log("Deployer balance:", (await ethers.provider.getBalance(deployer)).toString());

  const entryFee = ethers.parseEther("0.01");
  const Lottery = await ethers.getContractFactory("Lottery");
  const lottery = await Lottery.deploy(entryFee);

  console.log("Lottery deployed to:", lottery.target);


  for (let i = 0; i < 10; i++) {
    const player = accounts[i];
    const tx = await lottery.connect(player).joinLottery(player.address, { value: entryFee });
    await tx.wait();
    console.log(`Player ${i + 1} joined: ${player.address}`);
  }


  const winner = await lottery.winnerOf(1n);
  const prize = await lottery.prizeOf(1n);

  console.log("\n=== Round 1 Results ===");
  console.log("Winner:", winner);
  console.log("Prize (wei):", prize.toString());


  console.log("\nUpdated Balances:");
  for (let i = 0; i < 10; i++) {
    const addr = accounts[i].address;
    const balance = await ethers.provider.getBalance(addr);
    console.log(`${i + 1}. ${addr} => ${ethers.formatEther(balance)} ETH`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
