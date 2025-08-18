import { expect } from "chai";
import { ethers } from "hardhat";

describe("PiggyBank & Factory", function () {
  it("should set deployer as admin", async function () {
    const [admin] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("Factory");
    const factory = await Factory.deploy();
    expect(await factory.admin()).to.equal(admin);
  });

  it("should create user PiggyBank and track lock time", async function () {
    const [, user] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("Factory");
    const factory = await Factory.deploy();

    await factory.connect(user).createUserContract();
    const piggyAddress = await factory.userContracts(user);
    expect(piggyAddress).to.not.equal(ethers.ZeroAddress);

    const PiggyBank = await ethers.getContractFactory("PiggyBank");
    const piggy = PiggyBank.attach(piggyAddress) as any;

    await piggy.connect(user).createSavingPlan(
      "School",
      "School fees",
      30 * 24 * 60 * 60,
      0,
      0, 
      ethers.ZeroAddress
    );

    const plans = await piggy.getPlanNames();
    expect(plans[0]).to.equal("School");
  });

  it("should deposit Ether and reflect in balances", async function () {
    const [, user] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("Factory");
    const factory = await Factory.deploy();

    await factory.connect(user).createUserContract();
    const piggyAddress = await factory.userContracts(user.address);
    const PiggyBank = await ethers.getContractFactory("PiggyBank");
    const piggy = PiggyBank.attach(piggyAddress) as any;

    await piggy.connect(user).createSavingPlan(
      "Health",
      "Medical savings",
      30 * 24 * 60 * 60,
      0,
      0, 
      ethers.ZeroAddress
    );

    await piggy.connect(user).depositEther(0, { value: ethers.parseEther("1") });
    const balances = await piggy.getTotalBalances();
    expect(balances[0]).to.equal(ethers.parseEther("1"));
  });
});