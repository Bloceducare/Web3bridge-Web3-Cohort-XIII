import { expect } from "chai";
import { ethers } from "hardhat";

describe("LudoGame", function () {
  it("should register a player", async function () {
    const [player1] = await ethers.getSigners();
    const LudoToken = await ethers.getContractFactory("LudoToken");
    const ludoToken = await LudoToken.deploy(ethers.parseEther("1000"));
    const LudoGame = await ethers.getContractFactory("LudoGame");
    const ludoGame = await LudoGame.deploy(await ludoToken.getAddress());

    await ludoToken.connect(player1).approve(await ludoGame.getAddress(), ethers.parseEther("5"));
    await ludoGame.connect(player1).register("Deborah", 0);
    const [name, score, color, position] = await ludoGame.getPlayer(player1.address);
    expect(name).to.equal("Deborah");
    expect(score).to.equal(0n);
    expect(color).to.equal(0n);
    expect(position).to.equal(0n);
    expect(await ludoToken.balanceOf(await ludoGame.getAddress())).to.equal(ethers.parseEther("5"));
  });

  it("should prevent duplicate color registration", async function () {
    const [player1, player2] = await ethers.getSigners();
    const LudoToken = await ethers.getContractFactory("LudoToken");
    const ludoToken = await LudoToken.deploy(ethers.parseEther("1000"));
    const LudoGame = await ethers.getContractFactory("LudoGame");
    const ludoGame = await LudoGame.deploy(await ludoToken.getAddress());

    await ludoToken.connect(player1).approve(await ludoGame.getAddress(), ethers.parseEther("5"));
    await ludoGame.connect(player1).register("Deborah", 0);
    await ludoToken.connect(player2).approve(await ludoGame.getAddress(), ethers.parseEther("5"));
    await expect(ludoGame.connect(player2).register("Bob", 0))
      .to.be.revertedWith("Color already used!");
  });

  it("should roll dice and move player", async function () {
    const [player1] = await ethers.getSigners();
    const LudoToken = await ethers.getContractFactory("LudoToken");
    const ludoToken = await LudoToken.deploy(ethers.parseEther("1000"));
    const LudoGame = await ethers.getContractFactory("LudoGame");
    const ludoGame = await LudoGame.deploy(await ludoToken.getAddress());

    await ludoToken.connect(player1).approve(await ludoGame.getAddress(), ethers.parseEther("15"));
    await ludoGame.connect(player1).register("Deborah", 0);
    await ludoGame.connect(player1).rollDice();
    const [, , , position] = await ludoGame.getPlayer(player1.address);
    expect(position).to.be.gte(0n).lte(40n);
  });

  it("should prevent unregistered players from rolling dice", async function () {
    const [player1] = await ethers.getSigners();
    const LudoToken = await ethers.getContractFactory("LudoToken");
    const ludoToken = await LudoToken.deploy(ethers.parseEther("1000"));
    const LudoGame = await ethers.getContractFactory("LudoGame");
    const ludoGame = await LudoGame.deploy(await ludoToken.getAddress());

    await ludoToken.connect(player1).approve(await ludoGame.getAddress(), ethers.parseEther("5"));
    await expect(ludoGame.connect(player1).rollDice())
      .to.be.revertedWith("Register first!");
  });
});