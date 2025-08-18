import { ethers } from 'hardhat';

async function main() {
  console.log('Starting Ludo Game Interaction...\n');

  const signers = await ethers.getSigners();
  const deployer = signers[0];
  const players = signers.slice(1, 5);

  console.log('Deployer:', deployer.address);

  console.log('Deploying contracts...');
  const LudoTokenFactory = await ethers.getContractFactory('LudoToken');
  const ludoToken = await LudoTokenFactory.deploy();
  await ludoToken.waitForDeployment();

  const LudoGameFactory = await ethers.getContractFactory('LudoGame');
  const ludoGame = await LudoGameFactory.deploy(await ludoToken.getAddress());
  await ludoGame.waitForDeployment();

  console.log('LudoToken deployed to:', await ludoToken.getAddress());
  console.log('LudoGame deployed to:', await ludoGame.getAddress());

  const stakeAmount = ethers.parseEther('100');

  console.log('\nDistributing tokens to players...');
  for (let i = 0; i < 4; i++) {
    await ludoToken.transfer(players[i].address, ethers.parseEther('500'));
    await ludoToken
      .connect(players[i])
      .approve(await ludoGame.getAddress(), stakeAmount);
    console.log(`Player ${i + 1} (${players[i].address}): 500 LUDO tokens`);
  }

  console.log('\nRegistering players...');
  const colors = ['RED', 'GREEN', 'BLUE', 'YELLOW'];
  const names = ['Alice', 'Bob', 'Charlie', 'David'];

  for (let i = 0; i < 4; i++) {
    await ludoGame.connect(players[i]).registerPlayer(names[i], i);
    console.log(`${names[i]} registered with ${colors[i]} color`);
  }

  console.log('\nPlayers staking tokens...');
  for (let i = 0; i < 4; i++) {
    await ludoGame.connect(players[i]).stakeTokens();
    console.log(`${names[i]} staked 100 LUDO tokens`);
  }

  const gameState = await ludoGame.getGameState();
  console.log('\nGame State:', gameState === 1n ? 'ACTIVE' : 'WAITING');

  console.log('\nStarting game simulation...');

  let gameActive = true;
  let turn = 0;
  let moveCount = 0;
  const maxMoves = 50;

  while (gameActive && moveCount < maxMoves) {
    const currentPlayer = players[turn % 4];
    const playerName = names[turn % 4];

    try {
      const diceValue = await ludoGame
        .connect(currentPlayer)
        .rollDice.staticCall();
      await ludoGame.connect(currentPlayer).rollDice();
      console.log(`${playerName} rolled: ${diceValue}`);

      await ludoGame.connect(currentPlayer).makeMove(Number(diceValue));

      const playerInfo = await ludoGame.getPlayerInfo(0, turn % 4);
      console.log(
        `${playerName} moved to position: ${playerInfo.position} (Score: ${playerInfo.score})`
      );

      if (playerInfo.position >= 100) {
        console.log(`${playerName} WINS THE GAME!`);
        gameActive = false;

        const finalBalance = await ludoToken.balanceOf(currentPlayer.address);
        console.log(
          `${playerName} final balance: ${ethers.formatEther(
            finalBalance
          )} LUDO`
        );
        break;
      }

      turn++;
      moveCount++;

      if (moveCount % 4 === 0) {
        console.log('\n--- Round completed ---');
      }
    } catch (error: any) {
      if (error.message.includes('Game not active')) {
        console.log('Game has ended');
        gameActive = false;
      } else {
        console.log('Error:', error.message);
        turn++;
      }
    }
  }

  if (moveCount >= maxMoves) {
    console.log('\nGame ended due to move limit');
  }

  console.log('\nFinal Game Stats:');
  for (let i = 0; i < 4; i++) {
    try {
      const playerInfo = await ludoGame.getPlayerInfo(0, i);
      const balance = await ludoToken.balanceOf(players[i].address);
      console.log(
        `${names[i]} (${colors[i]}): Position ${playerInfo.position}, Score ${
          playerInfo.score
        }, Balance: ${ethers.formatEther(balance)} LUDO`
      );
    } catch (error) {
      console.log(`${names[i]}: Could not fetch info`);
    }
  }

  const finalGameState = await ludoGame.getGameState();
  console.log(
    '\nFinal Game State:',
    finalGameState === 0n
      ? 'WAITING'
      : finalGameState === 1n
      ? 'ACTIVE'
      : 'FINISHED'
  );

  console.log('\nLudo game interaction completed!');
  console.log(`Token Contract: ${await ludoToken.getAddress()}`);
  console.log(`Game Contract: ${await ludoGame.getAddress()}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
