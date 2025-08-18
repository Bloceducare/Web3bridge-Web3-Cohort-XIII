import { ethers } from "hardhat";

async function main() {
  // Replace with your deployed contract addresses
  const LUDO_TOKEN_ADDRESS = "0x..."; // Replace with actual address
  const LUDO_GAME_ADDRESS = "0x...";  // Replace with actual address

  const [owner, player1, player2] = await ethers.getSigners();

  // Get contract instances
  const ludoToken = await ethers.getContractAt("LudoToken", LUDO_TOKEN_ADDRESS);
  const ludoGame = await ethers.getContractAt("LudoGame", LUDO_GAME_ADDRESS);

  console.log("=== Ludo Game Interaction Demo ===");

  // Check initial balances
  console.log("\n1. Initial Token Balances:");
  console.log(`Owner: ${ethers.formatEther(await ludoToken.balanceOf(owner.address))} LUDO`);
  console.log(`Player1: ${ethers.formatEther(await ludoToken.balanceOf(player1.address))} LUDO`);
  console.log(`Player2: ${ethers.formatEther(await ludoToken.balanceOf(player2.address))} LUDO`);

  // Mint tokens for players
  console.log("\n2. Minting tokens for players...");
  await ludoToken.mint(player1.address, ethers.parseEther("1000"));
  await ludoToken.mint(player2.address, ethers.parseEther("1000"));
  
  console.log(`Player1 balance after mint: ${ethers.formatEther(await ludoToken.balanceOf(player1.address))} LUDO`);
  console.log(`Player2 balance after mint: ${ethers.formatEther(await ludoToken.balanceOf(player2.address))} LUDO`);

  // Create a game
  console.log("\n3. Player1 creating a game...");
  const entryFee = ethers.parseEther("100");
  
  await ludoToken.connect(player1).approve(await ludoGame.getAddress(), entryFee);
  await ludoGame.connect(player1).createGame(entryFee);
  
  console.log(`Game created with entry fee: ${ethers.formatEther(entryFee)} LUDO`);

  // Check game details
  const game = await ludoGame.getGame(1);
  console.log(`Game ID: ${game.id}`);
  console.log(`Creator: ${game.players[0]}`);
  console.log(`Entry Fee: ${ethers.formatEther(game.entryFee)} LUDO`);
  console.log(`Is Active: ${game.isActive}`);

  // Player2 joins the game
  console.log("\n4. Player2 joining the game...");
  await ludoToken.connect(player2).approve(await ludoGame.getAddress(), entryFee);
  await ludoGame.connect(player2).joinGame(1);
  
  const updatedGame = await ludoGame.getGame(1);
  console.log(`Player2 joined: ${updatedGame.players[1]}`);

  console.log("\n5. Token Balances after game setup:");
  console.log(`Player1: ${ethers.formatEther(await ludoToken.balanceOf(player1.address))} LUDO`);
  console.log(`Player2: ${ethers.formatEther(await ludoToken.balanceOf(player2.address))} LUDO`);
  console.log(`Game Contract: ${ethers.formatEther(await ludoToken.balanceOf(await ludoGame.getAddress()))} LUDO`);

  console.log("\n6. Completing game (Player1 wins)...");
  await ludoGame.completeGame(1, player1.address);
  
  const completedGame = await ludoGame.getGame(1);
  console.log(`Game completed. Winner: ${completedGame.winner}`);
  console.log(`Game is active: ${completedGame.isActive}`);

  console.log("\n7. Final Token Balances:");
  console.log(`Player1: ${ethers.formatEther(await ludoToken.balanceOf(player1.address))} LUDO`);
  console.log(`Player2: ${ethers.formatEther(await ludoToken.balanceOf(player2.address))} LUDO`);
  console.log(`Game Contract: ${ethers.formatEther(await ludoToken.balanceOf(await ludoGame.getAddress()))} LUDO`);

  console.log("\n=== Demo Complete ===");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});