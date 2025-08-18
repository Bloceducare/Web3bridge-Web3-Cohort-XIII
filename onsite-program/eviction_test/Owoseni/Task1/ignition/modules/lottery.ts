const hre = require("hardhat");

async function main() {
  const Lottery = await hre.ethers.getContractFactory("Lottery");
  const lottery = await Lottery.deploy();
  await lottery.deployed();
  console.log("Lottery deployed to:", lottery.address);

  const signers = await hre.ethers.getSigners();
  for (let i = 0; i < 10; i++) {
    await lottery.connect(signers[i]).enter({ value: hre.ethers.utils.parseEther("0.01") });
  }
  console.log("10 players added, winner chosen:", await lottery.winner());

  console.log("Lottery balance after:", await hre.ethers.provider.getBalance(lottery.address));

  await lottery.reset();
  console.log("Lottery reset, players:", await lottery.getPlayers().length);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});