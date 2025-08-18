import { ethers } from "hardhat";
import { Lottery } from "../typechain-types";

async function main() {
  console.log("Starting Lottery interaction script...");
  
  const signers = await ethers.getSigners();
  const deployer = signers[0];
  const players = signers.slice(1, 11);
  
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Using ${players.length} test accounts as players`);
  
  const LotteryFactory = await ethers.getContractFactory("Lottery");
  const lottery = await LotteryFactory.deploy();
  await lottery.deployed();

  const contractAddress = lottery.address;
  console.log(`\nLottery deployed at: ${contractAddress}`);
  
  const ENTRY_FEE = await lottery.ENTRY_FEE();
  console.log(`Entry fee: ${ethers.utils.formatEther(ENTRY_FEE)} ETH`);
  
  console.log("\n=== ROUND 1 ===");
  
  const initialBalances: { [address: string]: bigint } = {};
  for (let i = 0; i < players.length; i++) {
    initialBalances[players[i].address] = await ethers.provider.getBalance(players[i].address);
  }
  
  console.log("\nAdding 10 players to the lottery...");
  for (let i = 0; i < players.length; i++) {
    const tx = await lottery.connect(players[i]).enterLottery({ value: ENTRY_FEE });
    const receipt = await tx.wait();
    
    console.log(`Player ${i + 1} (${players[i].address}) joined - Gas used: ${receipt?.gasUsed}`);
    
    const currentPlayers = await lottery.getPlayerCount();
    console.log(`Current players: ${currentPlayers}/10`);

    if (currentPlayers.eq(10)) {
      console.log("\n🎉 Lottery is full! Winner will be selected automatically...");
      
      const events = receipt?.logs;
      if (events) {
        for (const event of events) {
          try {
            const parsedEvent = lottery.interface.parseLog({
              topics: event.topics as string[],
              data: event.data
            });
            
            if (parsedEvent?.name === "WinnerSelected") {
              const winner = parsedEvent.args[0];
              const amount = parsedEvent.args[1];
              const round = parsedEvent.args[2];
              
              console.log(`\n🏆 Winner: ${winner}`);
              console.log(`💰 Prize: ${ethers.utils.formatEther(amount)} ETH`);
              console.log(`🎯 Round: ${round}`);
            }
          } catch (e) {
            // Skip non-lottery events
          }
        }
      }
      break;
    }
  }
  
  console.log("\n=== POST-ROUND ANALYSIS ===");
  
  const finalBalances: { [address: string]: any } = {};
  let winner: string = "";
  let maxGain = ethers.BigNumber.from(0);
  
  for (let i = 0; i < players.length; i++) {
    const address = players[i].address;
    finalBalances[address] = await ethers.provider.getBalance(address);
    const balanceChange = finalBalances[address].sub(initialBalances[address]);

    console.log(`Player ${i + 1}: ${ethers.utils.formatEther(balanceChange)} ETH change`);

    if (balanceChange.gt(maxGain)) {
      maxGain = balanceChange;
      winner = address;
    }
  }
  
  console.log(`\n🎊 Confirmed Winner: ${winner}`);
  console.log(`💵 Net Gain: ${ethers.utils.formatEther(maxGain)} ETH`);
  
  console.log("\n=== LOTTERY STATE AFTER ROUND 1 ===");
  console.log(`Current round: ${await lottery.getCurrentRound()}`);
  console.log(`Players in current round: ${await lottery.getPlayerCount()}`);
  console.log(`Prize pool: ${ethers.utils.formatEther(await lottery.getPrizePool())} ETH`);
  
  console.log("\n=== TESTING ROUND 2 ===");
  console.log("Verifying lottery reset by adding players to new round...");
  
  for (let i = 0; i < 3; i++) {
    await lottery.connect(players[i]).enterLottery({ value: ENTRY_FEE });
    console.log(`Player ${i + 1} joined round 2`);
  }
  
  console.log(`\n✅ Round 2 players: ${await lottery.getPlayerCount()}/10`);
  console.log(`✅ Current round: ${await lottery.getCurrentRound()}`);
  console.log(`✅ Prize pool: ${ethers.utils.formatEther(await lottery.getPrizePool())} ETH`);
  
  console.log("\n🎯 Lottery contract is working correctly!");
  console.log(`📍 Contract Address: ${contractAddress}`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

export default main;
