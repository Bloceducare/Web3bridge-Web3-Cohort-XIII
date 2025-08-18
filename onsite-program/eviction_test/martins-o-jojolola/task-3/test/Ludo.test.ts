import { expect } from "chai";
import { ethers } from "hardhat";
import { LudoFactory, LudoGame } from "../typechain-types";

describe("LudoFactory with existing ERC20", () => {
  let factory: LudoFactory;
  let game: LudoGame;
  let token: any;
  let owner: any, p1: any, p2: any;

  const STAKE = ethers.parseEther("10");

  beforeEach(async () => {
    [owner, p1, p2] = await ethers.getSigners();

    // Deploy a lightweight ERC20 for local test
    const ERC20 = await ethers.getContractFactory("contracts/MockToken.sol:MockToken");
    token = await ERC20.deploy();
    await token.waitForDeployment();

    // Deploy factory
    const Factory = await ethers.getContractFactory("LudoFactory");
    factory = (await Factory.deploy()) as LudoFactory;
    await factory.waitForDeployment();

    // Create a game
    const tx = await factory.createGame(await token.getAddress(), STAKE);
    const receipt = await tx.wait();
    const event = receipt!.logs.find(
      (log: any) => log.fragment && log.fragment.name === "GameCreated"
    );
    const gameAddr = event!.args!.game;

    const Game = await ethers.getContractFactory("LudoGame");
    game = (await Game.attach(gameAddr)) as LudoGame;

    // Give tokens to players
    await token.transfer(p1.address, ethers.parseEther("100"));
    await token.transfer(p2.address, ethers.parseEther("100"));
  });

  it("registers and stakes with provided ERC20", async () => {
    await game.connect(p1).register("Alice", 0);
    await token.connect(p1).approve(await game.getAddress(), STAKE);
    await game.connect(p1).stake();

    const bal = await token.balanceOf(await game.getAddress());
    expect(bal).to.equal(STAKE);
  });
});
