import { ethers } from "hardhat";

async function main() {
  console.log("Setting up Ludo Game demo...");


  const [deployer, player1, player2, player3, player4] = await ethers.getSigners();
  
  console.log("Deployer:", deployer.address);
  console.log("Player 1:", player1.address);
  console.log("Player 2:", player2.address);
  console.log("Player 3:", player3.address);
  console.log("Player 4:", player4.address);

  console.log("\n1. Deploying contracts...");
  const LudoTokenFactory = await ethers.getContractFactory("LudoToken");
  const ludoToken = await LudoTokenFactory.deploy();
  await ludoToken.waitForDeployment();
  
  const LudoGameFactory = await ethers.getContractFactory("LudoGame");
  const ludoGame = await LudoGameFactory.deploy(await ludoToken.getAddress());
  await ludoGame.waitForDeployment();

  await ludoToken.authorizeGame(await ludoGame.getAddress());

  console.log("LudoToken:", await ludoToken.getAddress());
  console.log("LudoGame:", await ludoGame.getAddress());

  console.log("\n2. Minting tokens to players...");
  const mintAmount = ethers.parseEther("1000");
  
  await ludoToken.mintTokens(player1.address, mintAmount);
  await ludoToken.mintTokens(player2.address, mintAmount);
  await ludoToken.mintTokens(player3.address, mintAmount);
  await ludoToken.mintTokens(player4.address, mintAmount);

  console.log("Minted 1000 LUDO tokens to each player");

  console.log("\n3. Approving token spending...");
  const approveAmount = ethers.parseEther("500");
  
  await ludoToken.connect(player1).approve(await ludoGame.getAddress(), approveAmount);
  await ludoToken.connect(player2).approve(await ludoGame.getAddress(), approveAmount);
  await ludoToken.connect(player3).approve(await ludoGame.getAddress(), approveAmount);
  await ludoToken.connect(player4).approve(await ludoGame.getAddress(), approveAmount);

  console.log("Players approved game contract to spend 500 LUDO tokens");

  // Create a demo game
  console.log("\n4. Creating demo game...");
  await ludoGame.connect(player1).createGame("Alice");
  console.log("Player 1 (Alice) created game 0");

  // Join the game
  await ludoGame.connect(player2).joinGame(0, "Bob");
  console.log("Player 2 (Bob) joined game 0");

  await ludoGame.connect(player3).joinGame(0, "Charlie");
  console.log("Player 3 (Charlie) joined game 0");

  await ludoGame.connect(player4).joinGame(0, "Diana");
  console.log("Player 4 (Diana) joined game 0");

  // Check game state
  const gameData = await ludoGame.getGame(0);
  console.log("\n5. Game Status:");
  console.log("Game ID:", gameData.id.toString());
  console.log("Player Count:", gameData.playerCount.toString());
  console.log("Game State:", gameData.state === 0n ? "WAITING" : gameData.state === 1n ? "ACTIVE" : "FINISHED");

  console.log("\n6. Player Details:");
  for (let i = 0; i < Number(gameData.playerCount); i++) {
    const playerData = await ludoGame.getPlayer(0, i);
    const colorNames = ["RED", "GREEN", "BLUE", "YELLOW"];
    console.log(`Player ${i + 1}: ${playerData.name} (${playerData.playerAddress}) - Color: ${colorNames[Number(playerData.color)]}`);
  }

  
  console.log("\n7. Staking tokens...");
  await ludoGame.connect(player1).stakeTokens(0);
  console.log("Player 1 staked tokens");

  await ludoGame.connect(player2).stakeTokens(0);
  console.log("Player 2 staked tokens");

  await ludoGame.connect(player3).stakeTokens(0);
  console.log("Player 3 staked tokens");

  await ludoGame.connect(player4).stakeTokens(0);
  console.log("Player 4 staked tokens - Game should start now!");

  const finalGameData = await ludoGame.getGame(0);
  console.log("\n8. Final Game Status:");
  console.log("Game State:", finalGameData.state === 0n ? "WAITING" : finalGameData.state === 1n ? "ACTIVE" : "FINISHED");
  console.log("Total Stake:", ethers.formatEther(finalGameData.totalStake), "LUDO");
  console.log("Current Player:", finalGameData.currentPlayerIndex.toString());

  const currentPlayerAddress = await ludoGame.getCurrentPlayer(0);
  console.log("Current Player Address:", currentPlayerAddress);

  console.log(" Demo setup completed!");
  console.log(" Game is ready to play!");
  console.log("- Players can now roll dice using rollDice(0)");
  console.log("- Move pieces using movePiece(gameId, pieceIndex, diceRoll)");
  console.log("- First player to get all 4 pieces to safety wins all staked tokens!");

  return {
    ludoToken: await ludoToken.getAddress(),
    ludoGame: await ludoGame.getAddress(),
    gameId: 0
  };
}

main()
  .then(() => {
    console.log("Demo setup successful!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Demo setup failed:", error);
    process.exit(1);
  });
