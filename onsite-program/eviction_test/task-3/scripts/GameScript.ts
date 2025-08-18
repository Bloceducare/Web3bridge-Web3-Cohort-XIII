import hre from "hardhat";

async function main() {
  console.log("🎮 Ludo Game Demo Script");
  console.log("========================");

  // Get signers (players)
  const [deployer, player1, player2, player3, player4] = await hre.ethers.getSigners();

  console.log("\n Deploying contracts...");
  
  // Deploy GameToken
  const GameTokenFactory = await hre.ethers.getContractFactory("GameToken");
  const gameToken = await GameTokenFactory.deploy(1000000); // 1M tokens
  await gameToken.waitForDeployment();
  
  console.log(`✅ GameToken deployed to: ${await gameToken.getAddress()}`);

  // Deploy LudoGame
  const LudoGameFactory = await hre.ethers.getContractFactory("LudoGame");
  const ludoGame = await LudoGameFactory.deploy(await gameToken.getAddress());
  await ludoGame.waitForDeployment();
  
  console.log(`✅ LudoGame deployed to: ${await ludoGame.getAddress()}`);

  // Mint tokens to players
  console.log("\n💰 Minting tokens to players...");
  const mintAmount = hre.ethers.parseEther("100");
  
  await gameToken.mint(player1.address, mintAmount);
  await gameToken.mint(player2.address, mintAmount);
  await gameToken.mint(player3.address, mintAmount);
  await gameToken.mint(player4.address, mintAmount);
  
  console.log(`✅ Minted 100 LGT tokens to each player`);

  // Create a new game
  console.log("\n🎯 Creating a new game...");
  const createGameTx = await ludoGame.createGame();
  await createGameTx.wait();
  const gameId = 1;
  
  console.log(`✅ Game created with ID: ${gameId}`);

  // Register players
  console.log("\n👥 Registering players...");
  
  await ludoGame.connect(player1).registerPlayer(gameId, "Alice", 0); // RED
  console.log("✅ Alice registered with RED color");
  
  await ludoGame.connect(player2).registerPlayer(gameId, "Bob", 1); // BLUE
  console.log("✅ Bob registered with BLUE color");
  
  await ludoGame.connect(player3).registerPlayer(gameId, "Charlie", 2); // GREEN
  console.log("✅ Charlie registered with GREEN color");

  // Check game info
  const gameInfo = await ludoGame.getGameInfo(gameId);
  console.log(`\n📊 Game Info: ${gameInfo.playerCount} players registered`);

  // Players approve and stake tokens
  console.log("\n💎 Players staking tokens...");
  const stakeAmount = hre.ethers.parseEther("10");
  
  // Player 1 stakes
  await gameToken.connect(player1).approve(await ludoGame.getAddress(), stakeAmount);
  await ludoGame.connect(player1).stakeTokens(gameId);
  console.log("✅ Alice staked 10 LGT tokens");
  
  // Player 2 stakes
  await gameToken.connect(player2).approve(await ludoGame.getAddress(), stakeAmount);
  await ludoGame.connect(player2).stakeTokens(gameId);
  console.log("✅ Bob staked 10 LGT tokens");
  
  // Player 3 stakes
  await gameToken.connect(player3).approve(await ludoGame.getAddress(), stakeAmount);
  await ludoGame.connect(player3).stakeTokens(gameId);
  console.log("✅ Charlie staked 10 LGT tokens");

  // Check if game started
  const updatedGameInfo = await ludoGame.getGameInfo(gameId);
  console.log(`\n🚀 Game started: ${updatedGameInfo.gameStarted}`);
  console.log(`💰 Total prize pool: ${hre.ethers.formatEther(updatedGameInfo.totalPrize)} LGT`);

  // Simulate some dice rolls
  console.log("\n🎲 Starting gameplay...");
  
  for (let round = 1; round <= 5; round++) {
    console.log(`\n--- Round ${round} ---`);
    
    // Get current turn
    const currentGameInfo = await ludoGame.getGameInfo(gameId);
    const currentPlayerIndex = currentGameInfo.currentPlayerTurn;
    
    let currentPlayer;
    let playerName;
    
    switch (currentPlayerIndex) {
      case 0:
        currentPlayer = player1;
        playerName = "Alice";
        break;
      case 1:
        currentPlayer = player2;
        playerName = "Bob";
        break;
      case 2:
        currentPlayer = player3;
        playerName = "Charlie";
        break;
      default:
        currentPlayer = player1;
        playerName = "Alice";
    }
    
    console.log(`🎯 ${playerName}'s turn (Player ${currentPlayerIndex})`);
    
    // Roll dice
    const rollTx = await ludoGame.connect(currentPlayer).rollDice(gameId);
    const receipt = await rollTx.wait();
    
    // Get player's new position
    const playerInfo = await ludoGame.getPlayerInfo(gameId, currentPlayerIndex);
    console.log(`📍 ${playerName} moved to position: ${playerInfo.position}`);
    
    // Check if game ended
    const finalGameInfo = await ludoGame.getGameInfo(gameId);
    if (finalGameInfo.gameEnded) {
      console.log(`\n🏆 GAME OVER! Winner: ${finalGameInfo.winner}`);
      console.log(`💰 Prize: ${hre.ethers.formatEther(finalGameInfo.totalPrize)} LGT`);
      break;
    }
  }

  // Display final positions
  console.log("\n📊 Final Player Positions:");
  const finalGameInfo = await ludoGame.getGameInfo(gameId);
  
  for (let i = 0; i < finalGameInfo.playerCount; i++) {
    const playerInfo = await ludoGame.getPlayerInfo(gameId, i);
    console.log(`${playerInfo.name}: Position ${playerInfo.position}`);
  }

  console.log("\n✨ Demo completed!");
}

// Handle errors
main().catch((error) => {
  console.error("❌ Error:", error);
  process.exitCode = 1;
});