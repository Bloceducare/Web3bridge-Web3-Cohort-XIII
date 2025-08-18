import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, Signer } from "ethers";

describe("SimpleLudo", function () {
  it("should register a player with valid name and color", async function () {
    const Token = await ethers.getContractFactory("SimpleToken");
    const token = await Token.deploy("LudoToken", "LDT", ethers.utils.parseEther("10000"));
    await token.deployed();

    const SimpleLudo = await ethers.getContractFactory("SimpleLudo");
    const [owner, player1] = await ethers.getSigners();
    const ludo = await SimpleLudo.deploy(token.address);
    await ludo.deployed();

    const player1Address = await player1.getAddress();
    const STAKE_AMOUNT = ethers.utils.parseEther("100");

    await token.transfer(player1Address, ethers.utils.parseEther("1000"));
    await token.connect(player1).approve(ludo.address, STAKE_AMOUNT);

    await expect(ludo.connect(player1).registerPlayer("Alice", 0))
      .to.emit(ludo, "PlayerRegistered")
      .withArgs(player1Address, "Alice", 0);

    const player = await ludo.getPlayer(player1Address);
    expect(player.name).to.equal("Alice");
    expect(player.color).to.equal(0); // RED
    expect(player.stake).to.equal(STAKE_AMOUNT);
  });

  it("should revert if color is taken", async function () {
    const Token = await ethers.getContractFactory("SimpleToken");
    const token = await Token.deploy("LudoToken", "LDT", ethers.utils.parseEther("10000"));
    await token.deployed();

    const SimpleLudo = await ethers.getContractFactory("SimpleLudo");
    const [owner, player1, player2] = await ethers.getSigners();
    const ludo = await SimpleLudo.deploy(token.address);
    await ludo.deployed();

    const STAKE_AMOUNT = ethers.utils.parseEther("100");

    await token.transfer(player1.getAddress(), ethers.utils.parseEther("1000"));
    await token.transfer(player2.getAddress(), ethers.utils.parseEther("1000"));
    await token.connect(player1).approve(ludo.address, STAKE_AMOUNT);
    await token.connect(player2).approve(ludo.address, STAKE_AMOUNT);

    await ludo.connect(player1).registerPlayer("Alice", 0); // RED
    await expect(ludo.connect(player2).registerPlayer("Bob", 0))
      .to.be.revertedWithCustomError(ludo, "ColorTaken");
  });

  it("should allow player to move and emit events", async function () {
    const Token = await ethers.getContractFactory("SimpleToken");
    const token = await Token.deploy("LudoToken", "LDT", ethers.utils.parseEther("10000"));
    await token.deployed();

    const SimpleLudo = await ethers.getContractFactory("SimpleLudo");
    const [owner, player1] = await ethers.getSigners();
    const ludo = await SimpleLudo.deploy(token.address);
    await ludo.deployed();

    const player1Address = await player1.getAddress();
    const STAKE_AMOUNT = ethers.utils.parseEther("100");

    await token.transfer(player1Address, ethers.utils.parseEther("1000"));
    await token.connect(player1).approve(ludo.address, STAKE_AMOUNT);
    await ludo.connect(player1).registerPlayer("Alice", 0);

    await expect(ludo.connect(player1).makeMove())
      .to.emit(ludo, "DiceRolled")
      .withArgs(player1Address, (args: any) => args >= 1 && args <= 6);

    const player = await ludo.getPlayer(player1Address);
    expect(player.position).to.be.at.least(1).and.at.most(6);
  });

  it("should declare winner when reaching BOARD_END", async function () {
    const Token = await ethers.getContractFactory("SimpleToken");
    const token = await Token.deploy("LudoToken", "LDT", ethers.utils.parseEther("10000"));
    await token.deployed();

    const SimpleLudo = await ethers.getContractFactory("SimpleLudo");
    const [owner, player1, player2] = await ethers.getSigners();
    const ludo = await SimpleLudo.deploy(token.address);
    await ludo.deployed();

    const player1Address = await player1.getAddress();
    const STAKE_AMOUNT = ethers.utils.parseEther("100");

    await token.transfer(player1.getAddress(), ethers.utils.parseEther("1000"));
    await token.transfer(player2.getAddress(), ethers.utils.parseEther("1000"));
    await token.connect(player1).approve(ludo.address, STAKE_AMOUNT);
    await token.connect(player2).approve(ludo.address, STAKE_AMOUNT);
    await ludo.connect(player1).registerPlayer("Alice", 0);
    await ludo.connect(player2).registerPlayer("Bob", 1);

    for (let i = 0; i < 10; i++) {
      await ludo.connect(player1).makeMove();
      const player = await ludo.getPlayer(player1Address);
      if (player.position >= 50) {
        await expect(ludo.connect(player1).makeMove())
          .to.emit(ludo, "WinnerDeclared")
          .withArgs(player1Address, STAKE_AMOUNT.mul(2));
        expect((await ludo.getAllPlayers()).length).to.equal(0);
        break;
      }
    }
  });

  it("should allow owner to reset game", async function () {
    const Token = await ethers.getContractFactory("SimpleToken");
    const token = await Token.deploy("LudoToken", "LDT", ethers.utils.parseEther("10000"));
    await token.deployed();

    const SimpleLudo = await ethers.getContractFactory("SimpleLudo");
    const [owner, player1] = await ethers.getSigners();
    const ludo = await SimpleLudo.deploy(token.address);
    await ludo.deployed();

    const STAKE_AMOUNT = ethers.utils.parseEther("100");

    await token.transfer(player1.getAddress(), ethers.utils.parseEther("1000"));
    await token.connect(player1).approve(ludo.address, STAKE_AMOUNT);
    await ludo.connect(player1).registerPlayer("Alice", 0);

    await ludo.connect(owner).resetGame();
    expect((await ludo.getAllPlayers()).length).to.equal(0);
  });
});