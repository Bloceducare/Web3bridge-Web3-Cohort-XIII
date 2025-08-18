import { expect } from "chai";
import { ethers } from "hardhat";
import { LudoGame, LudoToken } from "../typechain-types";

describe("LudoGame", function () {
  let game: LudoGame;
  let token: LudoToken;
  
  beforeEach(async function () {
    const [owner] = await ethers.getSigners();
    
    const LudoToken = await ethers.getContractFactory("LudoToken");
    token = await LudoToken.deploy();
    
    const LudoGame = await ethers.getContractFactory("LudoGame");
    game = await LudoGame.deploy(await token.getAddress(), ethers.parseEther("10"));
  });
  
  it("Should register players", async function () {
    await game.registerPlayer("Alice", 0); // RED
    expect(await game.playerCount()).to.equal(1);
  });
});