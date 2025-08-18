import { expect } from "chai";
import { ethers } from "hardhat";
import { LudoGame,  } from "../typechain-types";

describe("LudoGame", function () {
  let token;
  let ludo: LudoGame;
  let owner: any, p1: any, p2: any, p3: any, p4: any;
  const STAKE = ethers.parseEther("100");

  beforeEach(async function () {
    [owner, p1, p2, p3, p4] = await ethers.getSigners();

    // Deploy mock ERC20 token (OpenZeppelin preset)
    const Token = await ethers.getContractFactory("ERC20PresetMinterPauser");
    token = await Token.deploy("LudoToken", "LUDO");
    await token.waitForDeployment();

    // Mint tokens to players
    for (let p of [p1, p2, p3, p4]) {
      await token.connect(owner).mint(p.address, ethers.parseEther("1000"));
    }

    // Deploy LudoGame
    const Ludo = await ethers.getContractFactory("LudoGame");
    ludo = await Ludo.deploy(await token.getAddress());
    await ludo.waitForDeployment();
  });

  it("should create a game", async function () {
    await expect(ludo.connect(p1).createGame(STAKE))
      .to.emit(ludo, "GameCreated")
      .withArgs(1, STAKE);

    const info = await ludo.gameInfo(1);
    expect(info[0]).to.equal(1); // gameId
    expect(info[1]).to.equal(0); // playerCount
    expect(info[2]).to.equal(STAKE); // stakeAmount
  });

  it("should allow players to join with unique colors", async function () {
    await ludo.connect(p1).createGame(STAKE);

    await expect(ludo.connect(p1).joinGame(1, "Alice", 0))
      .to.emit(ludo, "PlayerJoined")
      .withArgs(1, p1.address, "Alice", 0);

    await expect(ludo.connect(p2).joinGame(1, "Bob", 1))
      .to.emit(ludo, "PlayerJoined")
      .withArgs(1, p2.address, "Bob", 1);

    const player1 = await ludo.playerInfo(1, 0);
    expect(player1[0]).to.equal(p1.address);
    expect(player1[1]).to.equal("Alice");
  });

  it("should require players to stake before game starts", async function () {
    await ludo.connect(p1).createGame(STAKE);
    await ludo.connect(p1).joinGame(1, "Alice", 0);
    await ludo.connect(p2).joinGame(1, "Bob", 1);

    // Approvals
    await token.connect(p1).approve(await ludo.getAddress(), STAKE);
    await token.connect(p2).approve(await ludo.getAddress(), STAKE);

    // Stake
    await expect(ludo.connect(p1).stake(1))
      .to.emit(ludo, "PlayerStaked")
      .withArgs(1, p1.address, STAKE);

    await expect(ludo.connect(p2).stake(1))
      .to.emit(ludo, "GameStarted"); // Should auto-start when all staked

    const info = await ludo.gameInfo(1);
    expect(info[4]).to.equal(1); // GameState.IN_PROGRESS
  });

  it("should roll dice and move token", async function () {
    await ludo.connect(p1).createGame(STAKE);
    await ludo.connect(p1).joinGame(1, "Alice", 0);
    await ludo.connect(p2).joinGame(1, "Bob", 1);

    // Approvals & staking
    await token.connect(p1).approve(await ludo.getAddress(), STAKE);
    await token.connect(p2).approve(await ludo.getAddress(), STAKE);
    await ludo.connect(p1).stake(1);
    await ludo.connect(p2).stake(1);

    // Roll dice + move token
    await expect(ludo.connect(p1).rollAndPlay(1, 0))
      .to.emit(ludo, "DiceRolled");
  });

  it("should declare winner and transfer prize", async function () {
    await ludo.connect(p1).createGame(STAKE);
    await ludo.connect(p1).joinGame(1, "Alice", 0);

    await token.connect(p1).approve(await ludo.getAddress(), STAKE);
    await ludo.connect(p1).stake(1);

  
    const game = await ludo.games(1);
    
  });
});
