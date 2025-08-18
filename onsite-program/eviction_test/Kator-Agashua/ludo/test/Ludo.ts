const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Ludo Contract", function () {
  it("should deploy and initialize staking token", async function () {
    const [deployer] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("ERC20PresetMinterPauser");
    const token = await Token.deploy("MockToken", "MTK");
    await token.deployed();

    const stakeAmount = ethers.utils.parseUnits("100", 18);
    const Ludo = await ethers.getContractFactory("Ludo");
    const ludo = await Ludo.deploy(token.address, stakeAmount);
    await ludo.deployed();

    expect(await ludo.stakingToken()).to.equal(token.address);
    expect(await ludo.stakeAmount()).to.equal(stakeAmount);
  });

  it("should allow a user to register and stake tokens", async function () {
    const [deployer, alice] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("ERC20PresetMinterPauser");
    const token = await Token.deploy("MockToken", "MTK");
    await token.deployed();

    const stakeAmount = ethers.utils.parseUnits("100", 18);
    await token.mint(alice.address, stakeAmount);

    const Ludo = await ethers.getContractFactory("Ludo");
    const ludo = await Ludo.deploy(token.address, stakeAmount);
    await ludo.deployed();

    await token.connect(alice).approve(ludo.address, stakeAmount);
    await ludo.connect(alice).registerUser("Alice", 0);

    const player = await ludo.player(alice.address);
    expect(player._name).to.equal("Alice");
    expect(player._playerId).to.equal(1);

    const balance = await token.balanceOf(alice.address);
    expect(balance).to.equal(0);

    const totalStaked = await ludo.totalStaked();
    expect(totalStaked).to.equal(stakeAmount);
  });

  it("should allow a registered user to roll dice", async function () {
    const [deployer, alice] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("ERC20PresetMinterPauser");
    const token = await Token.deploy("MockToken", "MTK");
    await token.deployed();

    const stakeAmount = ethers.utils.parseUnits("100", 18);
    await token.mint(alice.address, stakeAmount);

    const Ludo = await ethers.getContractFactory("Ludo");
    const ludo = await Ludo.deploy(token.address, stakeAmount);
    await ludo.deployed();

    await token.connect(alice).approve(ludo.address, stakeAmount);
    await ludo.connect(alice).registerUser("Alice", 1);

    const roll = await ludo.connect(alice).rollDice();
    expect(roll).to.be.ok;

    const rolls = await ludo.numOfRoll(alice.address);
    expect(rolls).to.equal(1);

    const score = (await ludo.player(alice.address))._score;
    expect(score).to.be.gte(1);
    expect(score).to.be.lte(6);
  });

  it("should revert if unregistered user tries to roll", async function () {
    const [deployer, bob] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("ERC20PresetMinterPauser");
    const token = await Token.deploy("MockToken", "MTK");
    await token.deployed();

    const stakeAmount = ethers.utils.parseUnits("100", 18);
    const Ludo = await ethers.getContractFactory("Ludo");
    const ludo = await Ludo.deploy(token.address, stakeAmount);
    await ludo.deployed();

    await expect(ludo.connect(bob).rollDice()).to.be.revertedWith("Not registered.");
  });
});