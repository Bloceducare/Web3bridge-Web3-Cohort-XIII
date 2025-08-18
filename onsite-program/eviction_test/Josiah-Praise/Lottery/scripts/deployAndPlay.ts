import { ethers } from "hardhat";

async function main() {
  const accounts = await ethers.getSigners();
  const deployer = accounts[0]; // Your account

  console.log("Deploying with account:", deployer.address);
  console.log(
    "Account balance:",
    ethers.formatEther(await ethers.provider.getBalance(deployer.address))
  );

  const Lottery = await ethers.getContractFactory("Lottery");
  const lottery = await Lottery.deploy();
  console.log("Lottery deployed to:", await lottery.getAddress());

  // Since we're on testnet with only one account, we'll just enter once
  console.log("Entering lottery with deployer account...");
  const tx = await lottery
    .connect(deployer)
    .enter({ value: ethers.parseEther("0.01") });
  await tx.wait();
  console.log(`Player entered:`, deployer.address);

  // Check contract state
  const players = await lottery.getPlayers();
  console.log("Current players:", players);
  console.log(
    "Contract balance:",
    ethers.formatEther(
      await ethers.provider.getBalance(await lottery.getAddress())
    )
  );

  // Note: Winner function likely requires minimum players to work
  // This is just for testing deployment
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
