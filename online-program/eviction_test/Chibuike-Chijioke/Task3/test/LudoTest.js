const { expect } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const hre = require("hardhat");

describe("LudoArena with loadFixture", function () {
  const initialMint = hre.ethers.parseUnits("1000", 18);
  const stake = hre.ethers.parseUnits("10", 18);

  async function deployLudoFixture() {
    const [deployer, p1, p2, p3, p4] = await hre.ethers.getSigners();

    const TokenFactory = await hre.ethers.getContractFactory("AuroraToken");
    const token = await TokenFactory.deploy("AuroraToken", "AURA", 18, 0);
    await token.waitForDeployment();

    // Mint tokens to players
    await token.mint(p1.address, initialMint);
    await token.mint(p2.address, initialMint);
    await token.mint(p3.address, initialMint);

    // Deploy LudoArena
    const GameFactory = await hre.ethers.getContractFactory("LudoArena");
    const game = await GameFactory.deploy(await token.getAddress(), stake);
    await game.waitForDeployment();

    return { token, game, deployer, p1, p2, p3, p4 };
  }

  it("should register players, stake, start game and declare a winner", async function () {
    const { token, game, p1, p2, p3 } = await loadFixture(deployLudoFixture);

    await game.connect(p1).register("Alice", 0);
    await game.connect(p2).register("Bob", 1);
    await game.connect(p3).register("Charlie", 2);

    await token.connect(p1).approve(await game.getAddress(), stake);
    await token.connect(p2).approve(await game.getAddress(), stake);
    await token.connect(p3).approve(await game.getAddress(), stake);

    await game.connect(p1).stake();
    await game.connect(p2).stake();
    await game.connect(p3).stake();

    expect(await game.pot()).to.equal(stake * 3n);

    await game.startGame();
    expect(await game.started()).to.equal(true);

    let round = 0;
    const maxRounds = 200;
    const signers = [p1, p2, p3];
    let finished = false;

    while (!finished && round < maxRounds) {
      const curIdx = Number(await game.currentTurnIndex());
      const curAddr = (await game.getPlayer(curIdx))[0];
      const signer = signers.find(
        (s) => s.address.toLowerCase() === curAddr.toLowerCase()
      );

      await game.connect(signer).rollDiceWithSeed(round + 123);

      if (!(await game.started())) {
        finished = true;
      }
      round++;
    }

    expect(finished).to.equal(true);
    expect(await game.pot()).to.equal(0n);
  });
});
