import { expect } from "chai";
import { ethers } from "hardhat";


const toUnits = (n: string) => ethers.parseEther(n);

describe("web3BridgeLudo", function () {
  it("registers up to 4 players, enforces unique colors, and staking", async function () {
    const [deployer, a, b, c, d, e] = await ethers.getSigners();


    const Token = await ethers.getContractFactory("Ludo20Token");
    const token = await Token.connect(deployer).deploy();
    await token.waitForDeployment();

    const Game = await ethers.getContractFactory("web3BridgeLudo");
    const game = await Game.connect(deployer).deploy(await token.getAddress());
    await game.waitForDeployment();


    const MINT = toUnits("1000");
    await token.connect(deployer).mint(a.address, MINT);
    await token.connect(deployer).mint(b.address, MINT);
    await token.connect(deployer).mint(c.address, MINT);
    await token.connect(deployer).mint(d.address, MINT);


    await game.connect(a).register("Josh", 0); 
    await game.connect(b).register("Ayo", 1);   
    await game.connect(c).register("Mano", 2); 
    await game.connect(d).register("Dan", 3); 

    await expect(game.connect(e).register("Chief Engineer", 0)).to.be.revertedWithCustomError(
      game, "MaxPlayersReached"
    );

    await expect(game.connect(e).register("Chief Engineer", 2)).to.be.reverted;

    const STAKE = await game.STAKE();
    await token.connect(a).approve(await game.getAddress(), STAKE);
    await token.connect(b).approve(await game.getAddress(), STAKE);
    await token.connect(c).approve(await game.getAddress(), STAKE);
    await token.connect(d).approve(await game.getAddress(), STAKE);

    await game.connect(a).stake();
    await game.connect(b).stake();
    await game.connect(c).stake();
    await game.connect(d).stake();

    expect(await game.pot()).to.equal(STAKE * 4n);

    await game.connect(a).startGame();
    expect(await game.gameActive()).to.equal(true);


    expect(await game.currentPlayer()).to.equal(a.address);
  });

  it("enforces turn order and eventually picks a winner that receives the whole pot", async function () {
    const [deployer, a, b, c, d] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("Ludo20Token");
    const token = await Token.connect(deployer).deploy();
    await token.waitForDeployment();

    const Game = await ethers.getContractFactory("web3BridgeLudo");
    const game = await Game.connect(deployer).deploy(await token.getAddress());
    await game.waitForDeployment();

    const MINT = toUnits("1000");
    for (const s of [a, b, c, d]) {
      await token.connect(deployer).mint(s.address, MINT);
    }

    await game.connect(a).register("Josh", 0); 
    await game.connect(b).register("Ayo", 1);   
    await game.connect(c).register("Mano", 2); 
    await game.connect(d).register("Dan", 3);

    const STAKE = await game.STAKE();
    for (const s of [a, b, c, d]) {
      await token.connect(s).approve(await game.getAddress(), STAKE);
      await game.connect(s).stake();
    }
    const totalPot = STAKE * 4n;

    await game.connect(b).startGame();

    await expect(game.connect(b).rollDiceAndMove()).to.be.revertedWithCustomError(game, "NotYourTurn");


    const balancesBefore: Record<string, bigint> = {};
    for (const s of [a, b, c, d]) {
      balancesBefore[s.address] = await token.balanceOf(s.address);
    }

    let winner: string | null = null;
    for (let i = 0; i < 200; i++) {
      const current = await game.currentPlayer();
      const signer =
        current === a.address ? a :
        current === b.address ? b :
        current === c.address ? c : d;

      const tx = await game.connect(signer).rollDiceAndMove();
      const rcpt = await tx.wait();

 
      for (const log of rcpt!.logs) {
        try {
          const parsed = (await game.interface).parseLog(log);
          if (parsed?.name === "Winner") {
            winner = parsed.args.player as string;
          }
        } catch { }
      }

      if (!(await game.gameActive())) break;
    }

    expect(await game.gameActive()).to.equal(false);
    expect(winner).to.not.equal(null);

    const winnerBalAfter = await token.balanceOf(winner!);
    const winnerBalBefore = balancesBefore[winner!];
    expect(winnerBalAfter - winnerBalBefore).to.equal(totalPot);


    expect(await game.pot()).to.equal(0n);
  });
});

