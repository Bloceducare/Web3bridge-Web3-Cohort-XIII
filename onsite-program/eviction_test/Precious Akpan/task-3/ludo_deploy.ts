import { ethers } from "hardhat";

async function main() {
  const [deployer, p1, p2, p3, p4] = await ethers.getSigners();

  const LudoToken = await ethers.getContractFactory("LudoToken");
  const token = await LudoToken.deploy();
  await token.waitForDeployment();
  const tokenAddr = await token.getAddress();
  console.log("LudoToken:", tokenAddr);

  const stakeAmount = ethers.parseUnits("100", 18);
  const targetScore = 30n;

  const LudoGame = await ethers.getContractFactory("LudoGame");
  const game = await LudoGame.deploy(tokenAddr, stakeAmount, targetScore);
  await game.waitForDeployment();
  const gameAddr = await game.getAddress();
  console.log("LudoGame:", gameAddr);

  // Fund players with tokens
  const mintAmt = ethers.parseUnits("1000", 18);
  await (await token.mint(await p1.getAddress(), mintAmt)).wait();
  await (await token.mint(await p2.getAddress(), mintAmt)).wait();
  await (await token.mint(await p3.getAddress(), mintAmt)).wait();
  await (await token.mint(await p4.getAddress(), mintAmt)).wait();

  // Register players
  await (await game.connect(p1).registerPlayer("Alice", 0)).wait(); // RED
  await (await game.connect(p2).registerPlayer("Bob", 1)).wait();   // GREEN
  await (await game.connect(p3).registerPlayer("Carol", 2)).wait(); // BLUE
  await (await game.connect(p4).registerPlayer("Dave", 3)).wait();  // YELLOW

  // Approve and stake
  for (const s of [p1, p2, p3, p4]) {
    await (await token.connect(s).approve(gameAddr, stakeAmount)).wait();
    await (await game.connect(s).stake()).wait();
  }

  await (await game.startGame()).wait();
  console.log("Game started. Target score:", targetScore.toString());

  // Simulate up to 200 turns or until winner declared
  for (let i = 0; i < 200; i++) {
    const current = await game.currentPlayer();
    const signers = [p1, p2, p3, p4];
    const s = signers.find(async (x) => (await x.getAddress()) === current);
    const caller = (await p1.getAddress()) === current
      ? p1
      : (await p2.getAddress()) === current
      ? p2
      : (await p3.getAddress()) === current
      ? p3
      : p4;

    const tx = await game.connect(caller).rollDiceAndMove();
    await tx.wait();

    const w = await game.winner();
    if (w !== ethers.ZeroAddress) {
      console.log("Winner:", w);
      break;
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
