const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PiggyBank", function () {
  let owner, user1, factoryAdmin, token, piggyBank;

  beforeEach(async function () {
    [owner, user1, factoryAdmin] = await ethers.getSigners();

    // Deploy mock ERC20
    const ERC20Mock = await ethers.getContractFactory("ERC20Mock");
    token = await ERC20Mock.deploy("TestToken", "TTK", ethers.parseEther("1000"));
    await token.waitForDeployment();

    // Deploy ETH PiggyBank (address(0) means ETH savings)
    const PiggyBank = await ethers.getContractFactory("PiggyBank");
    piggyBank = await PiggyBank.deploy(
      owner.address,          // _owner
      ethers.ZeroAddress,     // _token (ETH)
      60 * 60 * 24,            // _lockPeriod (1 day)
      factoryAdmin.address    // _factoryAdmin
    );
    await piggyBank.waitForDeployment();
  });

  it("Should create a new ETH PiggyBank and deposit funds", async function () {
    // Deposit ETH
    await piggyBank.connect(owner).depositETH({ value: ethers.parseEther("1") });

    const balance = await piggyBank.getBalance();
    expect(balance).to.equal(ethers.parseEther("1"));
  });

  it("Should create a new ERC20 PiggyBank and deposit tokens", async function () {
    const PiggyBank = await ethers.getContractFactory("PiggyBank");
    const piggyBankToken = await PiggyBank.deploy(
      owner.address,
      token.target,           // ERC20 token address
      60 * 60 * 24,
      factoryAdmin.address
    );
    await piggyBankToken.waitForDeployment();

    // Approve tokens for deposit
    await token.connect(owner).approve(piggyBankToken.target, ethers.parseEther("10"));

    // Deposit ERC20 tokens
    await piggyBankToken.connect(owner).depositToken(ethers.parseEther("10"));

    const balance = await piggyBankToken.getBalance();
    expect(balance).to.equal(ethers.parseEther("10"));
  });
});
