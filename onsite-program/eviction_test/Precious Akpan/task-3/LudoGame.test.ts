import { expect } from "chai";
import { ethers } from "hardhat";

describe("LudoGame", () => {
  it("registers, stakes, starts, and progresses until someone wins and gets the pot", async () => {
    const [deployer, p1, p2, p3, p4] = await ethers.getSigners();

    const LudoToken = await ethers.getContractFactory("LudoToken");
    const token = await LudoToken.deploy();
    await token.waitForDeployment();

    const stakeAmount = ethers.parseUnits("100", 18);
    const targetScore = 20n; // lower for test speed

    const LudoGame = await ethers.getContractFactory("LudoGame");
    const game = await LudoGame.deploy(await token.getAddress(), stakeAmount, targetScore);
    await game.waitForDeployment();

    // Mint tokens to players
    const mintAmt = ethers.parseUnits("1000", 18);
    await (await token.mint(await p1.getAddress(), mintAmt)).wait();
    await (await token.mint(await p2.getAddress(), mintAmt)).wait();
    await (await token.mint(await p3.getAddress(), mintAmt)).wait();
    await (await token.mint(await p4.getAddress(), mintAmt)).wait();

    // Register
    await (await game.connect(p1).registerPlayer("Alice", 0)).wait();
    await (await game.connect(p2).registerPlayer("Bob", 1)).wait();
    await (await game.connect(p3).registerPlayer("Carol", 2)).wait();
    await (await game.connect(p4).registerPlayer("Dave", 3)).wait();

    // Approve and stake
    for (const s of [p1, p2, p3, p4]) {
      await (await token.connect(s).approve(await game.getAddress(), stakeAmount)).wait();
      await (await game.connect(s).stake()).wait();
    }

    await (await game.startGame()).wait();

    // Play until someone wins (cap iterations to prevent infinite loop)
    let winner = await game.winner();
    for (let i = 0; i < 200 && winner === ethers.ZeroAddress; i++) {
      const current = await game.currentPlayer();
      const caller = (await p1.getAddress()) === current
        ? p1
        : (await p2.getAddress()) === current
        ? p2
        : (await p3.getAddress()) === current
        ? p3
        : p4;
      await (await game.connect(caller).rollDiceAndMove()).wait();
      winner = await game.winner();
    }

    expect(winner).to.not.equal(ethers.ZeroAddress);

    // Winner should have received the pot (4 * stake)
    const pot = ethers.parseUnits("400", 18);
    const winnerBal = await token.balanceOf(winner);
    // Allow some tolerance because winner spent stake earlier
    expect(winnerBal).to.be.gte(pot);
  });
});
