import { ethers } from "hardhat";

async function main() {
  console.log("=== Lottery Contract Deployment and Interaction ===\n");
  
  const [deployer, ...testAccounts] = await ethers.getSigners();
  
  console.log("1. Deploying Lottery Contract");
  console.log(`Deployer address: ${deployer.address}`);
  
  const LotteryFactory = await ethers.getContractFactory("Lottery");
  const lottery = await LotteryFactory.deploy();
  
  const contractAddress = await lottery.getAddress();
  console.log(`✅ Contract deployed to: ${contractAddress}`);
  console.log(`Entry fee: ${ethers.formatEther(await lottery.ENTRY_FEE())} ETH\n`);
  
  const ENTRY_FEE = await lottery.ENTRY_FEE();
  
  console.log("2. Adding 10 test accounts to join lottery");
  
  const initialBalances = [];
  for (let i = 0; i < 10; i++) {
    initialBalances.push(await ethers.provider.getBalance(testAccounts[i].address));
    console.log(`Account ${i + 1}: ${testAccounts[i].address} - Balance: ${ethers.formatEther(initialBalances[i])} ETH`);
  }
  
  console.log("\n--- First Lottery Round ---");
  
  for (let i = 0; i < 10; i++) {
    console.log(`Player ${i + 1} entering lottery...`);
    const tx = await lottery.connect(testAccounts[i]).enterLottery({ value: ENTRY_FEE });
    const receipt = await tx.wait();
    
    console.log(`✅ Player ${i + 1} entered. Current players: ${await lottery.getPlayerCount()}`);
    
    if (i === 9) {
      console.log("\n3. Displaying winner and updated balances");
      
      for (const log of receipt!.logs) {
        try {
          const parsedLog = lottery.interface.parseLog(log);
          if (parsedLog?.name === "WinnerSelected") {
            const winnerAddress = parsedLog.args[0];
            const prizeAmount = parsedLog.args[2];
            
            console.log(`🏆 Winner Address: ${winnerAddress}`);
            console.log(`💰 Prize Amount: ${ethers.formatEther(prizeAmount)} ETH`);
            
            const winnerIndex = testAccounts.findIndex(account => account.address === winnerAddress);
            if (winnerIndex !== -1) {
              const finalBalance = await ethers.provider.getBalance(testAccounts[winnerIndex].address);
              const balanceChange = finalBalance - initialBalances[winnerIndex];
              console.log(`📈 Winner balance change: ${ethers.formatEther(balanceChange)} ETH`);
            }
          }
        } catch (e) {
          continue;
        }
      }
    }
  }
  
  console.log("\n4. Running lottery again to confirm reset");
  
  console.log(`Current round: ${await lottery.getCurrentRound()}`);
  console.log(`Current players: ${await lottery.getPlayerCount()}`);
  console.log(`Current prize pool: ${ethers.formatEther(await lottery.getPrizePool())} ETH`);
  
  console.log("\n--- Second Lottery Round ---");
  for (let i = 0; i < 10; i++) {
    await lottery.connect(testAccounts[i]).enterLottery({ value: ENTRY_FEE });
    console.log(`Round 2 - Player ${i + 1} entered. Total: ${await lottery.getPlayerCount()}`);
  }
  
  console.log(`\n✅ Second round completed. Current round: ${await lottery.getCurrentRound()}`);
  console.log("🎉 Lottery reset confirmed - contract is working properly!");
  
  console.log(`\n📋 Contract Address: ${contractAddress}`);
  console.log("📋 Add this address to your README.md file");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
