// test/LudoGame.test.ts
import { expect } from "chai";
import { ethers } from "hardhat";
import { LudoGame, LudoToken } from "../typechain-types";

describe("LudoGame", function () {
  let ludoGame: LudoGame;
  let ludoToken: LudoToken;
  let owner: any;
  let addr1: any;
  let addr2: any;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    const LudoToken = await ethers.getContractFactory("LudoToken");
    ludoToken = await LudoToken.deploy();
    await ludoToken.deployed();

    const LudoGame = await ethers.getContractFactory("LudoGame");
    ludoGame = await LudoGame.deploy(ludoToken.address);
    await ludoGame.deployed();

    await ludoToken.transfer(addr1.address, ethers.utils.parseEther("10"));
    await ludoToken.transfer(addr2.address, ethers.utils.parseEther("10"));
  });

  it("Should register players", async function () {
    await ludoToken.connect(addr1).approve(ludoGame.address, ethers.utils.parseEther("1"));
    await ludoGame.connect(addr1).register("Player1", 0); // RED
    expect((await ludoGame.getPlayer(addr1.address)).registered).to.be.true;
  });

  it("Should start game and make moves", async function () {
    await ludoToken.connect(addr1).approve(ludoGame.address, ethers.utils.parseEther("1"));
    await ludoGame.connect(addr1).register("Player1", 0); // RED
    await ludoToken.connect(addr1).transferFrom(addr1.address, ludoGame.address, ethers.utils.parseEther("1"));
    await ludoGame.connect(addr1).startGame();
    await ludoGame.connect(addr1).makeMove();
    expect((await ludoGame.getPlayer(addr1.address)).score).to.be.greaterThan(0);
  });
});