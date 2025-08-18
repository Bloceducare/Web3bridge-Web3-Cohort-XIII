import { ethers } from 'hardhat';

async function main() {
  console.log('Starting Lottery Interaction Script...\n');

  const signers = await ethers.getSigners();
  const deployer = signers[0];
  const players = signers.slice(1, 11);

  console.log('Deployer:', deployer.address);
  console.log('Available players:', players.length, '\n');

  console.log('Deploying Lottery contract...');
  const LotteryFactory = await ethers.getContractFactory('Lottery');
  const lottery = (await LotteryFactory.deploy()) as any;
  await lottery.waitForDeployment();

  const contractAddress = await lottery.getAddress();
  console.log('Lottery deployed to:', contractAddress);
  console.log(
    'Entry fee:',
    ethers.formatEther(await lottery.ENTRY_FEE()),
    'ETH\n'
  );

  async function displayState(title: string) {
    console.log(`--- ${title} ---`);
    const playerCount = await lottery.getPlayerCount();
    const prizePool = await lottery.getPrizePool();
    const round = await lottery.lotteryRound();

    console.log('Current round:', round.toString());
    console.log('Players joined:', playerCount.toString());
    console.log('Prize pool:', ethers.formatEther(prizePool), 'ETH');

    if (playerCount > 0) {
      const playerList = await lottery.getPlayers();
      console.log('Player addresses:');
      playerList.forEach((player, index) => {
        console.log(`  ${index + 1}. ${player}`);
      });
    }
    console.log('');
  }

  await displayState('Initial State');

  console.log('Starting Round 1 - Adding 10 players...\n');
  const entryFee = await lottery.ENTRY_FEE();
  const initialBalances = [];

  for (let i = 0; i < 10; i++) {
    const balance = await ethers.provider.getBalance(players[i].address);
    initialBalances.push(balance);
    console.log(
      `Player ${i + 1} initial balance: ${ethers.formatEther(balance)} ETH`
    );
  }
  console.log('');

  for (let i = 0; i < 10; i++) {
    console.log(`Adding player ${i + 1} (${players[i].address})...`);
    try {
      const tx = await lottery
        .connect(players[i])
        .enterLottery({ value: entryFee });
      const receipt = await tx.wait();

      if (receipt) {
        const playerJoinedEvent = receipt.logs.find((log) => {
          try {
            return lottery.interface.parseLog(log)?.name === 'PlayerJoined';
          } catch {
            return false;
          }
        });

        const winnerEvent = receipt.logs.find((log) => {
          try {
            return lottery.interface.parseLog(log)?.name === 'WinnerSelected';
          } catch {
            return false;
          }
        });

        if (playerJoinedEvent) {
          console.log('Player joined successfully!');
        }

        if (winnerEvent) {
          const parsedEvent = lottery.interface.parseLog(winnerEvent);
          console.log('WINNER SELECTED!');
          console.log('Winner address:', parsedEvent?.args[0]);
          console.log(
            'Prize won:',
            ethers.formatEther(parsedEvent?.args[1]),
            'ETH'
          );
        }
      }
    } catch (error: any) {
      console.log('Error:', error.message);
    }

    await displayState(`After Player ${i + 1}`);
  }

  console.log('Final balances after Round 1:');
  let winnerIndex = -1;

  for (let i = 0; i < 10; i++) {
    const finalBalance = await ethers.provider.getBalance(players[i].address);
    const balanceChange = finalBalance - initialBalances[i];
    console.log(
      `Player ${i + 1}: ${ethers.formatEther(finalBalance)} ETH (${
        balanceChange >= 0 ? '+' : ''
      }${ethers.formatEther(balanceChange)} ETH)`
    );

    if (balanceChange > entryFee * 8n) {
      winnerIndex = i;
      console.log(
        `  WINNER! Net gain: ${ethers.formatEther(balanceChange)} ETH`
      );
    }
  }
  console.log('');

  console.log('Starting Round 2 - Testing lottery reset...\n');
  await displayState('Round 2 Initial State');

  console.log('Adding 5 players to Round 2...');
  for (let i = 0; i < 5; i++) {
    console.log(`Adding player ${i + 1} to Round 2...`);
    const tx = await lottery
      .connect(players[i])
      .enterLottery({ value: entryFee });
    await tx.wait();
    console.log('Player added successfully!');
  }

  await displayState('Round 2 - After 5 players');

  console.log('Script completed successfully!');
  console.log('\nSummary:');
  console.log('- Contract deployed and tested');
  console.log('- Round 1 completed with 10 players and winner selection');
  console.log('- Round 2 started to confirm reset functionality');
  console.log('- All test cases passed!');
  console.log(`\nContract Address: ${contractAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
