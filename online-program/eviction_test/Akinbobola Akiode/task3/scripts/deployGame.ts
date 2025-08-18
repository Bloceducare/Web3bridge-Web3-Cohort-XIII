import { ethers, run, network } from "hardhat";

async function main() {
  const tokenAddr = process.env.TOKEN_ADDRESS;
  if (!tokenAddr) throw new Error("TOKEN_ADDRESS is required");

  const stake = process.env.STAKE_AMOUNT || "10";
  const shouldVerify = (process.env.VERIFY || "true").toLowerCase() === "true";
  const stakeWei = ethers.parseEther(stake);

  const [deployer] = await ethers.getSigners();
  console.log("deployer:", deployer.address);
  console.log("network:", network.name);
  console.log("token:", tokenAddr);

  const Game = await ethers.getContractFactory("LudoGame");
  const game = await Game.deploy(tokenAddr, stakeWei);
  await game.waitForDeployment();
  const gameAddr = await game.getAddress();
  console.log("game:", gameAddr);

  if (shouldVerify && network.name !== "hardhat") {
    console.log("verifying game...");
    try {
      await run("verify:verify", {
        address: gameAddr,
        constructorArguments: [tokenAddr, stakeWei],
      });
    } catch (e) {
      console.log("verify skipped:", (e as Error).message);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});


