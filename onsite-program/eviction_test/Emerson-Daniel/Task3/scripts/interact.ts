import { ethers } from "hardhat";

async function main() {
  console.log("Ludo Game Interaction Demo");

  const [deployer, player1, player2, player3, player4] = await ethers.getSigners();

  console.log("\nDeploying contracts for demo...");
  const GameToken = await ethers.getContractFactory("GameToken");
  const gameToken = await GameToken.deploy(1000000);
  await gameToken.deployed();

  const LudoGame = await ethers.getContractFactory("LudoGame");
  const ludoGame = await LudoGame.deploy(gameToken.address);
  await ludoGame.deployed();

  console.log("GameToken:", gameToken.address);
  console.log("LudoGame:", ludoGame.address);

  console.log("\nMinting tokens to players...");
  const stakeAmount = ethers.utils.parseEther("10");
  for (const player of [player1, player2, player3, player4]) {
    await gameToken.mint(player.address, ethers.utils.parseEther("100"));
    console.log(`Minted 100 tokens to ${player.address}`);
  }
  
  console.log("\nRegistering players...");
  const players = [
    { signer: player1, name: "Alice", color: 0 },
    { signer: player2, name: "Bob", color: 1 },
    { signer: player3, name: "Charlie", color: 2 },
    { signer: player4, name: "David", color: 3 }
  ];

  for (const player of players) {
    await ludoGame.connect(player.signer).registerPlayer(player.name, player.color);
    console.log(`${player.name} registered with color ${player.color}`);
  }

  let gameInfo = await ludoGame.getGameInfo();
  console.log(`\nGame State: ${gameInfo.state} (0=WAITING, 1=ACTIVE, 2=FINISHED)`);
  console.log(`Players Count: ${gameInfo.playersCount}`);
  
  console.log("\nPlayers staking tokens...");
  for (const player of players) {
    await gameToken.connect(player.signer).approve(ludoGame.address, stakeAmount);
    await ludoGame.connect(player.signer).stakeTokens();
    console.log(`${player.name} staked 10 tokens`);
  }

  gameInfo = await ludoGame.getGameInfo();
  console.log(`\nGame State: ${gameInfo.state} (Game Started!)`);
  console.log(`Total Staked: ${ethers.utils.formatEther(gameInfo.stakedAmount)} tokens`);
  
  console.log("\nSimulating dice rolls...");
  for (let round = 1; round <= 5; round++) {
    const currentPlayerAddr = await ludoGame.getCurrentPlayer();
    const currentPlayer = players.find(p => p.signer.address === currentPlayerAddr);

    if (currentPlayer) {
      console.log(`\nRound ${round}`);
      console.log(`Current Player: ${currentPlayer.name} (${currentPlayerAddr})`);

      const tx = await ludoGame.connect(currentPlayer.signer).rollDice();
      const receipt = await tx.wait();

      for (const log of receipt.logs) {
        try {
          const parsedLog = ludoGame.interface.parseLog(log);
          if (parsedLog.name === "DiceRolled") {
            console.log(`${currentPlayer.name} rolled: ${parsedLog.args.diceValue}`);
          } else if (parsedLog.name === "PlayerMoved") {
            console.log(`${currentPlayer.name} moved to position: ${parsedLog.args.newPosition}`);
          } else if (parsedLog.name === "GameWon") {
            console.log(`${currentPlayer.name} WON THE GAME!`);
            console.log(`Prize: ${ethers.utils.formatEther(parsedLog.args.prize)} tokens`);
            return;
          }
        } catch (e) {
        }
      }

      const playerInfo = await ludoGame.getPlayerInfo(currentPlayer.signer.address);
      console.log(`${currentPlayer.name}: Position ${playerInfo.position}, Score ${playerInfo.score}`);
    }

    gameInfo = await ludoGame.getGameInfo();
    if (gameInfo.state === 2) {
      console.log(`\nGame Finished! Winner: ${gameInfo.gameWinner}`);
      break;
    }
  }

  console.log("\nDemo completed!");
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

export default main;
