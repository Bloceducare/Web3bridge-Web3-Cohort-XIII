import { ethers } from "hardhat";

enum Color { RED, GREEN, BLUE, YELLOW }

async function main() {
  const [deployer, p1, p2, p3, p4] = await ethers.getSigners();

  const Token = await ethers.getContractFactory("LudoToken");
  const token = await Token.deploy(ethers.parseEther("1000000"));
  await token.waitForDeployment();
  console.log("LudoToken deployed:", await token.getAddress());

  const Game = await ethers.getContractFactory("LudoGame");
  const game = await Game.deploy(await token.getAddress(), ethers.parseEther("10"));
  await game.waitForDeployment();
  console.log("LudoGame deployed:", await game.getAddress());

  for (const player of [p1, p2, p3, p4]) {
    await (await token.mint(player.address, ethers.parseEther("100"))).wait();
  }

  await (await game.connect(p1).register("Alpha", Color.RED)).wait();
  await (await game.connect(p2).register("Bravo", Color.GREEN)).wait();
  await (await game.connect(p3).register("Charlie", Color.BLUE)).wait();
  await (await game.connect(p4).register("Delta", Color.YELLOW)).wait();

  for (const p of [p1, p2, p3, p4]) {
    await (await token.connect(p).approve(await game.getAddress(), ethers.parseEther("10"))).wait();
    await (await game.connect(p).stake()).wait();
  }

  await (await game.connect(p1).startGame()).wait();
  console.log("Game started 🎮");

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
        console.log("🎲", diceLog.args.player, "rolled", diceLog.args.roll.toString());
      }
      if (moveLog) {
        console.log("➡️", moveLog.args.player, "pos:", moveLog.args.newPosition.toString(), "score:", moveLog.args.newScore.toString());
      }
      if (winnerLog) {
        winner = winnerLog.args.winner;
        console.log("🏆 winner:", winner, "prize:", ethers.formatEther(winnerLog.args.prize));
        break;
      }
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});