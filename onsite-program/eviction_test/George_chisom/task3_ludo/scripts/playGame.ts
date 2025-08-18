import { ethers } from "hardhat";

async function main() {
  const TOKEN_ADDRESS = process.env.TOKEN_ADDRESS || "";
  const GAME_ADDRESS = process.env.GAME_ADDRESS || "";

  if (!TOKEN_ADDRESS || !GAME_ADDRESS) {
    console.error("Please set TOKEN_ADDRESS and GAME_ADDRESS environment variables");
    return;
  }

  const signers = await ethers.getSigners();
  const player1 = signers[0];
  const player2 = signers[1];

  const ludoToken = await ethers.getContractAt("LudoToken", TOKEN_ADDRESS);
  const ludoGame = await ethers.getContractAt("LudoGame", GAME_ADDRESS);

  const STAKE_AMOUNT = ethers.parseEther("100");

  console.log("Creating a new game...");
  const createTx = await ludoGame.createGame(STAKE_AMOUNT);
  await createTx.wait();
  console.log("Game created with ID: 1");

  console.log("Registering players...");
  await ludoGame.connect(player1).registerPlayer(1, "Player1", 0);
  await ludoGame.connect(player2).registerPlayer(1, "Player2", 1);
  console.log("Players registered");

  console.log("Approving tokens...");
  await ludoToken.connect(player1).approve(GAME_ADDRESS, STAKE_AMOUNT);
  await ludoToken.connect(player2).approve(GAME_ADDRESS, STAKE_AMOUNT);

  console.log("Staking tokens...");
  await ludoGame.connect(player1).stakeTokens(1);
  await ludoGame.connect(player2).stakeTokens(1);
  console.log("Game started!");

  const gameInfo = await ludoGame.getGameInfo(1);
  console.log("Game State:", gameInfo.state);
  console.log("Total Prize:", ethers.formatEther(gameInfo.totalPrize));

  console.log("Rolling dice and making moves...");
  const diceValue = await ludoGame.connect(player1).rollDice.staticCall(1);
  console.log("Player 1 rolled:", diceValue);

  await ludoGame.connect(player1).makeMove(1, Number(diceValue));
  console.log("Player 1 moved");

  const player1Info = await ludoGame.getPlayerInfo(1, 0);
  console.log("Player 1 position:", player1Info.position);
  console.log("Player 1 score:", player1Info.score);

  const currentPlayer = await ludoGame.getCurrentPlayer(1);
  console.log("Current player:", currentPlayer);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
