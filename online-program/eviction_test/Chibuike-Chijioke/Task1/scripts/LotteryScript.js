const { ethers } = require("hardhat");

async function main() {
  // Retrieve all available Ethereum accounts from the network
  const [deployer, ...players] = await ethers.getSigners();

  console.log("Deploying contract with:", deployer.address);

  // Deploy contract
  const Lottery = await ethers.getContractFactory("Lottery");
  const lottery = await Lottery.deploy();
  await lottery.waitForDeployment();

  console.log("Lottery deployed to:", await lottery.getAddress());

  const ENTRY_FEE = ethers.parseEther("0.01");

  // Record the initial ETH balances of the first 10 player accounts
  const balancesBefore = await Promise.all(
    players.slice(0, 10).map((p) => ethers.provider.getBalance(p.address))
  );

  // Mark the beginning of the first round
  console.log("\n=== ROUND 1 START ===");
  console.log("Round:", await lottery.getCurrentRound());

  // Simulate 10 players entering the lottery
  for (let i = 0; i < 10; i++) {
    await lottery.connect(players[i]).enterLottery({ value: ENTRY_FEE });
    console.log(`Player ${i + 1} entered: ${players[i].address}`);
  }

  // After 10 entries, the contract automatically selects a winner and starts a new round
  console.log("\nWinner Selected!");
  const roundAfter = await lottery.getCurrentRound();
  console.log("New Round:", roundAfter.toString());

  // Record the final ETH balances of the first 10 player accounts
  const balancesAfter = await Promise.all(
    players.slice(0, 10).map((p) => ethers.provider.getBalance(p.address))
  );

  console.log("\n=== Balances Before vs After ===");
  for (let i = 0; i < 10; i++) {
    console.log(
      `Player ${i + 1} (${
        players[i].address
      }):\n   Before: ${ethers.formatEther(
        balancesBefore[i]
      )} ETH\n   After:  ${ethers.formatEther(balancesAfter[i])} ETH\n`
    );
  }

  // Mark the beginning of the second round
  console.log("\n=== ROUND 2 START ===");

  // Simulate the next 10 players entering the lottery (if available)
  for (let i = 10; i < 20 && i < players.length; i++) {
    const player = players[i];
    await lottery.connect(player).enterLottery({ value: ENTRY_FEE });
    console.log(`Player ${i + 1} entered: ${player.address}`);
  }

  // Get and display the final round number
  const roundFinal = await lottery.getCurrentRound();
  console.log("Round after second game:", roundFinal.toString());

  // Mark the completion of the script
  console.log("\nScript complete");
}

// Execute the main function and handle any potential errors
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
