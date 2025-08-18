import { expect } from "chai";
import ethers  from "hardhat";
import { LudoGame } from "../typechain-types";
import { ERC20 } from "../typechain-types";

describe("LudoGame", function () {
  let ludo: LudoGame;
  let token: ERC20;
  let signers: ethers.Signer[];

  beforeEach(async function () {
    const Token = await ethers.getContractFactory("ERC20");
    token = await Token.deploy("TestToken", "TST") as ERC20;
    await token.deployed();

    const LudoGame = await ethers.getContractFactory("LudoGame");
    ludo = await LudoGame.deploy(token.address) as LudoGame;
    await ludo.deployed();

    signers = await ethers.getSigners();
    // Mint tokens to players
    await token.mint(signers[0].address, ethers.utils.parseEther("100"));
    await token.mint(signers[1].address, ethers.utils.parseEther("100"));
    await token.approve(ludo.address, ethers.utils.parseEther("100"));
    await token.connect(signers[1]).approve(ludo.address, ethers.utils.parseEther("100"));
  });

  it("Should register players", async function () {
    await ludo.register("Player1", 0); // RED
    const playerInfo = await ludo.getPlayer(signers[0].address);
    expect(playerInfo[1]).to.equal(0); // Color index
  });

  it("Should allow staking and moving", async function () {
    await ludo.register("Player1", 0);
    await token.approve(ludo.address, ethers.utils.parseEther("100"));
    await ludo.stakeTokens();
    await ludo.makeMove();
    const [name, color, position, stakedTokens] = await ludo.getPlayer(signers[0].address);
    expect(position).to.be.greaterThanOrEqual(1).and.lessThanOrEqual(6);
  });

  it("Should end game and distribute winnings", async function () {
    await ludo.register("Player1", 0);
    await ludo.connect(signers[1]).register("Player2", 1);
    await ludo.stakeTokens();
    await ludo.connect(signers[1]).stakeTokens();

    // Simulate reaching end (set position manually for testing)
    await ludo.makeMove(); // Move once
    await ethers.provider.send("evm_increaseTime", [3600]); // Move time for randomness
    await ludo.makeMove(); // Move again to reach end
    const winner = await ludo.winner();
    expect(winner).to.equal(signers[0].address);
    expect(await token.balanceOf(signers[0].address)).to.equal(ethers.utils.parseEther("100"));
  });
});