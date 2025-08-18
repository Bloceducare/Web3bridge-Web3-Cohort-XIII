import { ethers } from "hardhat";

async function main() {
  const [owner, ...accounts] = await ethers.getSigners();


  const Lottery = await ethers.getContractFactory("Lottery");
  const lottery = await Lottery.deploy(); 
  console.log("Lottery deployed at:", lottery.target);

 
  console.log("Players joining the lottery...");
  for (let i = 0; i < 10; i++) {
    await (lottery.connect(accounts[i]) as any).enter({ value: ethers.parseEther("0.01") });
    console.log(`Player ${i + 1}: ${accounts[i].address} joined`);
  }

  
  console.log("\nBalances after first round:");
  for (let i = 0; i < 10; i++) {
    const balance = await ethers.provider.getBalance(accounts[i].address);
    console.log(`Player ${i + 1}: ${balance} wei`);
  }

 
  console.log("\nRunning second round...");
  for (let i = 0; i < 10; i++) {
    await (lottery.connect(accounts[i]) as any).enter({ value: ethers.parseEther("0.01") });
    console.log(`Player ${i + 1}: ${accounts[i].address} joined`);
  }

  console.log("\nSecond round complete. Lottery resets automatically after picking winner.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
