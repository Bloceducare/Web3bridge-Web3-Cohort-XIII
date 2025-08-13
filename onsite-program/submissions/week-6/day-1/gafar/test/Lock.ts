import { expect } from "chai";
import { ethers } from "hardhat";
import { PiggyBank, TestToken } from "../typechain-types";

describe("PiggyBank", () => {
  let piggyBank: PiggyBank;
  let token: TestToken;
  let owner: any;
  let user1: any;
  let depositAmount = ethers.parseEther("10");

  it("should deploy ERC20 token and PiggyBank contract, and allow token savings", async () => {
    [owner, user1] = await ethers.getSigners();

    const TokenFactory = await ethers.getContractFactory("TestToken");
    token = await TokenFactory.connect(owner).deploy(ethers.parseEther("1000000"));
    await token.waitForDeployment();

    await token.transfer(user1.address, depositAmount);

    const PiggyBankFactory = await ethers.getContractFactory("PiggyBank");
    piggyBank = await PiggyBankFactory.connect(owner).deploy();
    await piggyBank.waitForDeployment();

    await token.connect(user1).approve(await piggyBank.getAddress(), depositAmount);

    await piggyBank.connect(user1).createAccount(
      "My Token Save",
      30 * 24 * 60 * 60, // 30 days
      await token.getAddress(),
      true,
      depositAmount
    );

    const instances = await piggyBank.getSavingInstances(user1.address);
    expect(instances.length).to.equal(1);
    expect(instances[0].amount).to.equal(depositAmount);
    expect(instances[0].isERC20).to.equal(true);
    expect(instances[0].tokenAddress).to.equal(await token.getAddress());
  });

  it("should create ETH-based savings and withdraw after lock", async () => {
    const ethAmount = ethers.parseEther("1");
    [owner, user1] = await ethers.getSigners();

    const PiggyBankFactory = await ethers.getContractFactory("PiggyBank");
    piggyBank = await PiggyBankFactory.connect(owner).deploy();
    await piggyBank.waitForDeployment();

    await piggyBank.connect(user1).createAccount(
      "ETH Save",
      1,
      ethers.ZeroAddress,
      false,
      ethAmount,
      { value: ethAmount }
    );

    await ethers.provider.send("evm_increaseTime", [2]);
    await ethers.provider.send("evm_mine");

    await expect(() =>
      piggyBank.connect(user1).withdrawMoney(0)
    ).to.changeEtherBalance(user1, ethAmount);
  });

  it("should apply 3% penalty for early ETH withdrawal", async () => {
    const ethAmount = ethers.parseEther("1");
    [owner, user1] = await ethers.getSigners();

    const PiggyBankFactory = await ethers.getContractFactory("PiggyBank");
    piggyBank = await PiggyBankFactory.connect(owner).deploy();
    await piggyBank.waitForDeployment();

    await piggyBank.connect(user1).createAccount(
      "ETH Early",
      1000,
      ethers.ZeroAddress,
      false,
      ethAmount,
      { value: ethAmount }
    );

    const expectedPayout = ethAmount - (ethAmount * 3n) / 100n;

    await expect(() =>
      piggyBank.connect(user1).withdrawMoney(0)
    ).to.changeEtherBalance(user1, expectedPayout);
  });

});
