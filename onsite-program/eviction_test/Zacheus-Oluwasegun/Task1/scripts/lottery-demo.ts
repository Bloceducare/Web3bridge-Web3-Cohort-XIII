import { network } from "hardhat";


const { ethers } = await network.connect({
  network: "hardhatOp",
  chainType: "op",
});

async function main() {

  const [deployer, ...accounts] = await ethers.getSigners();
  const ENTRY_FEE = ethers.parseEther("0.01");

  console.log(`Deployer: ${deployer.address}`);
  console.log(`Deployer balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH`);

  const LotteryFactory = await ethers.getContractFactory("Lottery");
  const lottery = await LotteryFactory.deploy();
  await lottery.waitForDeployment();
  
  const contractAddress = await lottery.getAddress();
  console.log(`Lottery deployed to: ${contractAddress}`);
  

  async function runLotteryRound(roundNumber: number) {
    console.log(`LOTTERY ROUND ${roundNumber}`);
    
    const testAccounts = accounts.slice(0, 10);
    const initialBalances: { [address: string]: bigint } = {};
    
    console.log("Initial balances:");
    for (let i = 0; i < testAccounts.length; i++) {
      const balance = await ethers.provider.getBalance(testAccounts[i].address);
      initialBalances[testAccounts[i].address] = balance;
      console.log(`Player ${i + 1} (${testAccounts[i].address}): ${ethers.formatEther(balance)} ETH`);
    }

    console.log("Players joining lottery...");
    
    for (let i = 0; i < 10; i++) {
      const player = testAccounts[i];
      
      console.log(`Player ${i + 1} joining...`);
      
      const tx = await lottery.connect(player).enterLottery({ value: ENTRY_FEE });
      const receipt = await tx.wait();
      
      const playerJoinedEvent = receipt?.logs.find((log:any) => {
        try {
          const parsed = lottery.interface.parseLog(log);
          return parsed?.name === "PlayerJoined";
        } catch {
          return false;
        }
      });

      if (playerJoinedEvent) {
        const parsed = lottery.interface.parseLog(playerJoinedEvent);
        console.log(`Player ${parsed?.args[0]} joined round ${parsed?.args[1]}`);
      }

      const currentPlayers = await lottery.getPlayersCount();
      const prizePool = await lottery.getPrizePool();
      console.log(`Players: ${currentPlayers}/10, Prize Pool: ${ethers.formatEther(prizePool)} ETH`);

      if (i === 9) {
        console.log("10th player joined! Winner selection triggered...");
        
        const winnerEvent = receipt?.logs.find((log : any) => {
          try {
            const parsed = lottery.interface.parseLog(log);
            return parsed?.name === "WinnerSelected";
          } catch {
            return false;
          }
        });

        if (winnerEvent) {
          const parsed = lottery.interface.parseLog(winnerEvent);
          const winner = parsed?.args[0];
          const amount = parsed?.args[1];
          const round = parsed?.args[2];
          
          console.log(`WINNER: ${winner}`);
          console.log(`Prize: ${ethers.formatEther(amount)} ETH`);
          console.log(`Round: ${round}`);
        }        
      }
    }

    console.log("Final balances and changes:");
    let winnerAddress = "";
    let maxGain = BigInt(0);

    for (let i = 0; i < testAccounts.length; i++) {
      const player = testAccounts[i];
      const finalBalance = await ethers.provider.getBalance(player.address);
      const balanceChange = finalBalance - initialBalances[player.address];
      const isWinner = balanceChange > ethers.parseEther("0.08");
      
      if (balanceChange > maxGain) {
        maxGain = balanceChange;
        winnerAddress = player.address;
      }

      console.log(`Player ${i + 1}: ${ethers.formatEther(finalBalance)} ETH (${balanceChange >= 0 ? '+' : ''}${ethers.formatEther(balanceChange)} ETH)${isWinner ? ' - WINNER!' : ''}`);
    }

    console.log(`Round ${roundNumber} Summary:`);
    console.log(`Winner: ${winnerAddress}`);
    console.log(`Current round: ${await lottery.currentRound()}`);
    console.log(`Contract balance: ${ethers.formatEther(await lottery.getPrizePool())} ETH`);

    return winnerAddress;
  }

  const round1Winner = await runLotteryRound(1);
  
  console.log("Waiting before starting round 2...");
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const round2Winner = await runLotteryRound(2);

  console.log("DEMO COMPLETE!");
  console.log("=================");
  console.log(`Round 1 Winner: ${round1Winner}`);
  console.log(`Round 2 Winner: ${round2Winner}`);
  console.log(`Contract Address: ${contractAddress}`);
  console.log(`Final Contract Balance: ${ethers.formatEther(await lottery.getPrizePool())} ETH`);
  console.log(`Current Round: ${await lottery.currentRound()}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
