import { expect } from "chai";
import { ethers } from "hardhat";
import { LudoGame, MyToken } from "../typechain-types";

import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("LudoGame", function () {
  let ludo: LudoGame;
  let token: MyToken;
  let owner: ethers.Signer;
  let player1: ethers.Signer;
  let player2: ethers.Signer;

  beforeEach(async () => {
    [owner, player1, player2] = await ethers.getSigners();

    // Deploy MyToken
    const TokenFactory = await ethers.getContractFactory("MyToken");
    token = (await TokenFactory.deploy(ethers.parseEther("1000"))) as MyToken;
    await token.waitForDeployment();

    // Deploy LudoGame
    const LudoFactory = await ethers.getContractFactory("LudoGame");
    ludo = (await LudoFactory.deploy(
      await token.getAddress(),
      ethers.parseEther("10")
    )) as LudoGame;
    await ludo.waitForDeployment();

    // Transfer tokens to players
    await token.transfer(await player1.getAddress(), ethers.parseEther("100"));
    await token.transfer(await player2.getAddress(), ethers.parseEther("100"));

    // Approve LudoGame to spend tokens
    await token.connect(player1).approve(await ludo.getAddress(), ethers.parseEther("10"));
    await token.connect(player2).approve(await ludo.getAddress(), ethers.parseEther("10"));

    // Debug: Verify allowances
    console.log("Player1 allowance:", (await token.allowance(await player1.getAddress(), await ludo.getAddress())).toString());
    console.log("Player2 allowance:", (await token.allowance(await player2.getAddress(), await ludo.getAddress())).toString());
  });

  it("should register players", async () => {
    await ludo.connect(player1).register("Alice", 0); // Red
    await ludo.connect(player2).register("Bob", 1); // Green

    const p1 = await ludo.players(await player1.getAddress());
    const p2 = await ludo.players(await player2.getAddress());

    expect(p1.name).to.equal("Alice");
    expect(p1.color).to.equal(0);
    expect(p2.name).to.equal("Bob");
    expect(p2.color).to.equal(1);
  });

  it("should start game when players stake", async () => {
    await ludo.connect(player1).register("Alice", 0); // Red
    await ludo.connect(player2).register("Bob", 1); // Green

    await expect(ludo.connect(owner).startGame()).to.emit(ludo, "GameStarted");
  });

  it("should allow dice roll and move", async () => {
    await ludo.connect(player1).register("Alice", 0); // Red
    await ludo.connect(player2).register("Bob", 1); // Green

    await ludo.connect(owner).startGame();

    const tx = await ludo.connect(player1).rollDice();
    const receipt = await tx.wait();

    // Find the DiceRolled event
    const event = receipt.logs.find((log) => {
      try {
        return ludo.interface.parseLog(log).name === "DiceRolled";
      } catch {
        return false;
      }
    });

    if (event) {
      const decodedEvent = ludo.interface.parseLog(event);
      const [player, value, newScore] = decodedEvent.args;
      console.log("Dice rolled by:", player, "value:", value.toString(), "new score:", newScore.toString());
      expect(value).to.be.gte(1).and.lte(6);
    } else {
      throw new Error("DiceRolled event not found");
    }
  });
});