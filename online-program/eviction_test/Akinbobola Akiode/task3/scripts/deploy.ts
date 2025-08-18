import { ethers, run, network } from "hardhat";

async function main() {
  const stake = process.env.STAKE_AMOUNT || "10";
  const initialSupply = process.env.INITIAL_SUPPLY || "1000000";
  const shouldVerify = (process.env.VERIFY || "true").toLowerCase() === "true";

  const stakeWei = ethers.parseEther(stake);
  const supplyWei = ethers.parseEther(initialSupply);

  const [deployer] = await ethers.getSigners();
  console.log("deployer:", deployer.address);
  console.log("network:", network.name);

  const Token = await ethers.getContractFactory("LudoToken");
  const token = await Token.deploy(supplyWei);
  await token.waitForDeployment();
  const tokenAddr = await token.getAddress();
  console.log("token:", tokenAddr);

  const Game = await ethers.getContractFactory("LudoGame");
  const game = await Game.deploy(tokenAddr, stakeWei);
  await game.waitForDeployment();
  const gameAddr = await game.getAddress();
  console.log("game:", gameAddr);

  if (shouldVerify && network.name !== "hardhat") {
    console.log("verifying...");
    try {
      await run("verify:verify", {
        address: tokenAddr,
        constructorArguments: [supplyWei],
      });
    } catch (e) {
      console.log("token verify skipped:", (e as Error).message);
    }
    try {
      await run("verify:verify", {
        address: gameAddr,
        constructorArguments: [tokenAddr, stakeWei],
      });
    } catch (e) {
      console.log("game verify skipped:", (e as Error).message);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});


