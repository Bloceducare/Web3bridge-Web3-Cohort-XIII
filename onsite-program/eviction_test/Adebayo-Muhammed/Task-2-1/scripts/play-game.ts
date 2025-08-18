import { ethers } from "hardhat";

async function main() {
  console.log("🎲 Ludo Game Interaction Demo\n");
  
  const [deployer, player1, player2, player3, player4] = await ethers.getSigners();
  
  // Deploy contracts first
  console.log("📦 Deploying contracts...");
  const LudoTokenFactory = await ethers.getContractFactory("LudoToken");
  const ludoToken = await LudoTokenFactory.deploy(1000000);
  await ludoToken.waitForDeployment();
  
  const LudoGameFactory = await ethers.getContractFactory("LudoGame");
  const ludoGame = await LudoGameFactory.deploy(await ludoToken.getAddress());
  await ludoGame.waitForDeployment();
  
  console.log(`✅ Contracts deployed!`);
  console.log(`Token: ${await ludoToken.getAddress()}`);
  console.log(`Game: ${await ludoGame.getAddress()}\n`);
  
  // Distribute tokens to players
  console.log("🪙 Distributing tokens to players...");
  const players = [player1, player2, player3, player4];
  const playerNames = ["Alice", "Bob", "Charlie", "David"];
  const colors = [0, 1, 2, 3]; // RED, GREEN, BLUE, YELLOW
  
  for (let i = 0; i < players.length; i++) {
    await ludoToken.mint(players[i].address, ethers.parseEther("1000"));
    await ludoToken.connect(players[i]).approve(await ludoGame.getAddress(), ethers.parseEther("100"));
    console.log(`✅ ${playerNames[i]} received 1000 LUDO tokens`);
  }
  
  // Create a new game
  console.log("\n🎮 Creating new game...");
  await ludoGame.createGame();
  const gameId = await ludoGame.gameCounter();
  console.log(`✅ Game created with ID: ${gameId}`);
  
  // Register players
  console.log("\n👥 Registering players...");
  for (let i = 0; i < 4; i++) {
    await ludoGame.connect(players[i]).registerPlayer(gameId, playerNames[i], colors[i]);
    console.log(`✅ ${playerNames[i]} registered with ${getColorName(colors[i])} color`);
  }
  
  // Check game info
  let gameInfo = await ludoGame.getGameInfo(gameId);
  console.log(`\n📊 Game Info: ${gameInfo.playerCount} players registered`);
  
  // Players stake tokens
  console.log("\n💰 Players staking tokens...");
  for (let i = 0; i < 4; i++) {
    await ludoGame.connect(players[i]).stakeTokens(gameId);
    console.log(`✅ ${playerNames[i]} staked 100 LUDO tokens`);
  }
  
  // Check if game started
  gameInfo = await ludoGame.getGameInfo(gameId);
  console.log(`\n🚀 Game Status: ${getGameState(gameInfo.state)}`);
  console.log(`💰 Total Prize Pool: ${ethers.formatEther(gameInfo.totalPrize)} LUDO`);
  
  // Simulate some dice rolls and moves
  console.log("\n🎲 Starting gameplay simulation...");
  
  for (let round = 0; round < 3; round++) {
    console.log(`\n--- Round ${round + 1} ---`);
    
    for (let playerIndex = 0; playerIndex < 4; playerIndex++) {
      const currentPlayer = await ludoGame.getCurrentPlayer(gameId);
      const playerName = playerNames.find((_, i) => players[i].address === currentPlayer);
      
      if (currentPlayer === ethers.ZeroAddress) {
        console.log("Game has ended!");
        break;
      }
      
      console.log(`🎯 ${playerName}'s turn`);
      
      // Roll dice
      const diceValue = await ludoGame.connect(players[playerIndex]).rollDice.staticCall(gameId);
      console.log(`🎲 ${playerName} rolled: ${diceValue}`);
      
      // Try to move a piece
      try {
        await ludoGame.connect(players[playerIndex]).movePiece(gameId, 0, diceValue);
        console.log(`🚶 ${playerName} moved piece 0`);
        
        // Get updated player info
        const playerInfo = await ludoGame.getPlayerInfo(gameId, playerIndex);
        console.log(`📊 ${playerName}'s score: ${playerInfo.score}`);
        console.log(`🏠 Pieces home: ${playerInfo.piecesHome}/4`);
        
      } catch (error) {
        console.log(`❌ ${playerName} couldn't move: ${error}`);
      }
      
      // Small delay for readability
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  // Final game state
  console.log("\n📊 Final Game State:");
  gameInfo = await ludoGame.getGameInfo(gameId);
  console.log(`Game Status: ${getGameState(gameInfo.state)}`);
  
  if (gameInfo.winner !== ethers.ZeroAddress) {
    const winnerName = playerNames.find((_, i) => players[i].address === gameInfo.winner);
    console.log(`🏆 Winner: ${winnerName} (${gameInfo.winner})`);
    console.log(`💰 Prize Won: ${ethers.formatEther(gameInfo.totalPrize)} LUDO`);
  }
  
  // Display all player stats
  console.log("\n👥 Player Statistics:");
  for (let i = 0; i < 4; i++) {
    const playerInfo = await ludoGame.getPlayerInfo(gameId, i);
    console.log(`${playerNames[i]} (${getColorName(Number(playerInfo.color))}):`);
    console.log(`  Score: ${playerInfo.score}`);
    console.log(`  Pieces Home: ${playerInfo.piecesHome}/4`);
    console.log(`  Piece Positions: [${playerInfo.piecePositions.join(', ')}]`);
  }
  
  console.log("\n🎉 Game simulation complete!");
}

function getColorName(color: number): string {
  const colors = ["RED", "GREEN", "BLUE", "YELLOW"];
  return colors[color] || "UNKNOWN";
}

function getGameState(state: bigint): string {
  const states = ["WAITING", "ACTIVE", "FINISHED"];
  return states[Number(state)] || "UNKNOWN";
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Game simulation failed:", error);
    process.exit(1);
  });
