import { ethers } from "hardhat";

async function main() {
  const [deployer, ...players] = await ethers.getSigners();
  const lotteryPrice = ethers.parseEther("0.001");

  console.log(`\n Deploying Lottery with deployer: ${deployer.address}`);

  const Lottery = await ethers.getContractFactory("Lottery");
  const lottery = await Lottery.deploy(lotteryPrice);
  await lottery.waitForDeployment();

  console.log(`Lottery deployed at: ${await lottery.getAddress()}\n`);

  for (let i = 0; i < 10; i++) {
    const bal = await ethers.provider.getBalance(players[i].address);
    console.log(`Player ${i} (${players[i].address}) balance before: ${ethers.formatEther(bal)} ETH`);
  }

  for (let i = 0; i < 10; i++) {
    const tx = await lottery.connect(players[i]).joinLottery({ value: lotteryPrice });
    const receipt = await tx.wait();

    for (const ev of receipt.logs) {
      try {
        const parsed = lottery.interface.parseLog(ev);
        if (parsed?.name === "WinnerEvent") {
          console.log(`\n Winner of Round 1: ${parsed.args[0]}`);
        }
      } catch(error) {
        console.error(error);
      }
    }
  }

  for (let i = 0; i < 10; i++) {
    const bal = await ethers.provider.getBalance(players[i].address);
    console.log(`Player ${i} (${players[i].address}) balance after: ${ethers.formatEther(bal)} ETH`);
  }

 
  console.log("Confirm Reset");

  // Join again with same 10 players
  for (let i = 0; i < 10; i++) {
    const tx = await lottery.connect(players[i]).joinLottery({ value: lotteryPrice });
    const receipt = await tx.wait();

    for (const ev of receipt.logs) {
      try {
        const parsed = lottery.interface.parseLog(ev);
        if (parsed?.name === "WinnerEvent") {
          console.log(`\n Winner of Round 2: ${parsed.args[0]}`);
        }
      } catch(error) {
        console.error(error);
      }
    }
  }

  console.log("\n Script finished successfully\n");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
