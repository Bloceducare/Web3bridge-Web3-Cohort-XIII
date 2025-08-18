import { ethers } from "hardhat";

async function main() {
  console.log("Setting up board game demo");

  const [deployer, participant1, participant2, participant3, participant4] = await ethers.getSigners();

  console.log("Deployer:", deployer.address);
  console.log("Participant 1:", participant1.address);
  console.log("Participant 2:", participant2.address);
  console.log("Participant 3:", participant3.address);
  console.log("Participant 4:", participant4.address);

  console.log("1. Deploying contracts");
  const TokenFactory = await ethers.getContractFactory("MaryjaneBoardGameToken");
  const gameToken = await TokenFactory.deploy();
  await gameToken.waitForDeployment();

  const ArenaFactory = await ethers.getContractFactory("MaryjaneBoardGameArena");
  const gameArena = await ArenaFactory.deploy(await gameToken.getAddress());
  await gameArena.waitForDeployment();

  await gameToken.approveGameContract(await gameArena.getAddress());

  console.log("Token:", await gameToken.getAddress());
  console.log("Arena:", await gameArena.getAddress());

  console.log("2. Creating tokens for participants");
  const mintAmount = ethers.parseEther("1000");

  await gameToken.createTokens(participant1.address, mintAmount);
  await gameToken.createTokens(participant2.address, mintAmount);
  await gameToken.createTokens(participant3.address, mintAmount);
  await gameToken.createTokens(participant4.address, mintAmount);

  console.log("Created 1000 tokens for each participant");

  console.log("3. Approving token spending");
  const approveAmount = ethers.parseEther("500");

  await gameToken.connect(participant1).approve(await gameArena.getAddress(), approveAmount);
  await gameToken.connect(participant2).approve(await gameArena.getAddress(), approveAmount);
  await gameToken.connect(participant3).approve(await gameArena.getAddress(), approveAmount);
  await gameToken.connect(participant4).approve(await gameArena.getAddress(), approveAmount);

  console.log("Participants approved arena contract to spend 500 tokens");

  // Create a demo game
  console.log("4. Creating demo match");
  await gameArena.connect(participant1).initializeMatch("Alice");
  console.log("Participant 1 (Alice) created match 0");

  await gameArena.connect(participant2).enterMatch(0, "Bob");
  console.log("Participant 2 (Bob) joined match 0");

  await gameArena.connect(participant3).enterMatch(0, "Charlie");
  console.log("Participant 3 (Charlie) joined match 0");

  await gameArena.connect(participant4).enterMatch(0, "Diana");
  console.log("Participant 4 (Diana) joined match 0");

  const matchData = await gameArena.getMatchDetails(0);
  console.log("5. Match Status:");
  console.log("Match ID:", matchData.id.toString());
  console.log("Participant Count:", matchData.participantCount.toString());
  console.log("Match State:", matchData.status === 0n ? "PENDING" : matchData.status === 1n ? "RUNNING" : "COMPLETED");

  console.log("6. Participant Details:");
  for (let i = 0; i < Number(matchData.participantCount); i++) {
    const participantData = await gameArena.getParticipantDetails(0, i);
    const colorNames = ["CRIMSON", "EMERALD", "SAPPHIRE", "GOLDEN"];
    console.log(`Participant ${i + 1}: ${participantData.name} (${participantData.walletAddress}) - Color: ${colorNames[Number(participantData.color)]}`);
  }

  console.log("7. Making deposits");
  await gameArena.connect(participant1).makeDeposit(0);
  console.log("Participant 1 made deposit");

  await gameArena.connect(participant2).makeDeposit(0);
  console.log("Participant 2 made deposit");

  await gameArena.connect(participant3).makeDeposit(0);
  console.log("Participant 3 made deposit");

  await gameArena.connect(participant4).makeDeposit(0);
  console.log("Participant 4 made deposit - Match should start now");

  const finalMatchData = await gameArena.getMatchDetails(0);
  console.log("8. Final Match Status:");
  console.log("Match State:", finalMatchData.status === 0n ? "PENDING" : finalMatchData.status === 1n ? "RUNNING" : "COMPLETED");
  console.log("Total Deposits:", ethers.formatEther(finalMatchData.totalDeposits), "tokens");
  console.log("Active Participant:", finalMatchData.activeParticipantIndex.toString());

  const activeParticipantAddress = await gameArena.getActiveParticipant(0);
  console.log("Active Participant Address:", activeParticipantAddress);

  console.log("Demo setup completed");
  console.log("Match is ready to play");
  console.log("- Participants can now throw dice using throwDice(0)");
  console.log("- Move tokens using moveToken(matchId, tokenIndex, diceResult)");
  console.log("- First participant to get all 4 tokens to secure zone wins all deposits");

  return {
    gameToken: await gameToken.getAddress(),
    gameArena: await gameArena.getAddress(),
    matchId: 0
  };
}

main()
  .then(() => {
    console.log("Demo setup successful");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Demo setup failed:", error);
    process.exit(1);
  });
