import { expect } from "chai";
import { ethers } from "hardhat";

enum Color { RED, GREEN, BLUE, YELLOW }

describe("LudoGame", function () {
  it("should register, stake, start, roll, and declare a winner", async function () {
    const [owner, p1, p2, p3, p4] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("LudoToken");
    const token = await Token.deploy(ethers.parseEther("1000000"));
    await token.waitForDeployment();

    const stakeAmount = ethers.parseEther("10");
    const Game = await ethers.getContractFactory("LudoGame");
    const game = await Game.deploy(await token.getAddress(), stakeAmount);
    await game.waitForDeployment();
    const tokenAddr = await token.getAddress();
    const gameAddr = await game.getAddress();
    console.log("Token:", tokenAddr);
    console.log("Game:", gameAddr);

    for (const player of [p1, p2, p3, p4]) {
      await (await token.mint(player.address, ethers.parseEther("100"))).wait();
    }

    await (await game.connect(p1).register("Alpha", Color.RED)).wait();
    await (await game.connect(p2).register("Bravo", Color.GREEN)).wait();
    await (await game.connect(p3).register("Charlie", Color.BLUE)).wait();
    await (await game.connect(p4).register("Delta", Color.YELLOW)).wait();

    expect(await game.playersCount()).to.equal(4n);

    for (const p of [p1, p2, p3, p4]) {
      await (await token.connect(p).approve(gameAddr, stakeAmount)).wait();
      const allowance = await token.allowance(p.address, gameAddr);
      const balBefore = await token.balanceOf(p.address);
      console.log("approve ok -> allowance", p.address, ethers.formatEther(allowance), "balance", ethers.formatEther(balBefore));
      await (await game.connect(p).stake()).wait();
      const balAfter = await token.balanceOf(p.address);
      console.log("staked ->", p.address, "balance", ethers.formatEther(balAfter));
    }

    const pot = await token.balanceOf(gameAddr);
    console.log("pot:", ethers.formatEther(pot));

    await expect(game.connect(p1).startGame()).to.emit(game, "GameStarted");

    let winner: string | null = null;
    for (let i = 0; i < 200 && !winner; i++) {
      for (const p of [p1, p2, p3, p4]) {
        const tx = await game.connect(p).rollDice();
        const rc = await tx.wait();
        const logs = rc!.logs.map((l) => {
          try { return game.interface.parseLog(l); } catch { return null; }
        }).filter(Boolean);

        const diceLog = logs.find((l) => l!.name === "DiceRolled");
        const moveLog = logs.find((l) => l!.name === "PlayerMoved");
        const winnerLog = logs.find((l) => l!.name === "WinnerDeclared");

        if (diceLog) {
          console.log("🎲 roll:", diceLog.args.player, diceLog.args.roll.toString());
        }
        if (moveLog) {
          console.log("➡️ move:", moveLog.args.player, "pos:", moveLog.args.newPosition.toString(), "score:", moveLog.args.newScore.toString());
        }
        if (winnerLog) {
          winner = winnerLog.args.winner;
          console.log("🏆 winner:", winner, "prize:", ethers.formatEther(winnerLog.args.prize));
          break;
        }
      }
    }

    expect(winner).to.not.equal(null);

    const prize = stakeAmount * 4n;
    const bal = await token.balanceOf(winner!);
    expect(bal).to.be.greaterThanOrEqual(ethers.parseEther("120"));
  });
});