import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("PiggyBank System", function () {

  async function deployFixture() {
    const [owner, user, other] = await hre.ethers.getSigners();

    const ERC20 = await hre.ethers.getContractFactory("ERC20");
    const erc20 = (await ERC20.deploy(
      "Mock Token",
      "MCK",
      await user.getAddress(),
      hre.ethers.parseEther("1000")
    )) as any;
    await erc20.waitForDeployment();

    const PiggyBankFactory = await hre.ethers.getContractFactory("PiggyBankFactory");
    const factory = await PiggyBankFactory.deploy();
    await factory.waitForDeployment();

  
    await factory.connect(user).createPiggyBank();
    const piggyBankAddress = await factory.getUserPiggyBank(await user.getAddress());
    const piggyBank = await hre.ethers.getContractAt("PiggyBank", piggyBankAddress) as any;

    return { owner, user, other, erc20, factory, piggyBank };
  }

  it("Should create a PiggyBank for user and prevent duplicates", async () => {
    const { factory, user } = await loadFixture(deployFixture);


    await expect(factory.connect(user).createPiggyBank())
      .to.be.revertedWithCustomError(factory, "PIGGY_BANK_ALREADY_EXISTS");
  });

  it("Should create ETH savings plan and emit event", async () => {
    const { piggyBank, user } = await loadFixture(deployFixture);

    const lockPeriod = 7 * 24 * 3600; // 7 days
    const deposit = hre.ethers.parseEther("1");

    await expect(
      piggyBank.connect(user).createETHSavingsPlan(lockPeriod, { value: deposit })
    )
      .to.emit(piggyBank, "SavingsPlanCreated")
      .withArgs(1, deposit, lockPeriod, hre.ethers.ZeroAddress);

    const plans = await piggyBank.getAllSavingsPlans();
    expect(plans.length).to.equal(1);
    expect(plans[0].amount).to.equal(deposit);
    expect(plans[0].lockPeriod).to.equal(lockPeriod);
    expect(plans[0].token).to.equal(hre.ethers.ZeroAddress);
  });

  it("Should allow withdrawal without penalty after lock period (ETH)", async () => {
    const { piggyBank, user } = await loadFixture(deployFixture);

    const lockPeriod = 3; // 3 seconds
    const deposit = hre.ethers.parseEther("1");

    await piggyBank.connect(user).createETHSavingsPlan(lockPeriod, { value: deposit });

   
    await hre.network.provider.send("evm_increaseTime", [lockPeriod + 1]);
    await hre.network.provider.send("evm_mine");

  
    await expect(piggyBank.connect(user).withdrawSavings(1))
      .to.emit(piggyBank, "Withrawal")
      .withArgs(1, deposit, 0, false);

    const activeCount = await piggyBank.getActivePlansCount();
    expect(activeCount).to.equal(0);
  });


  

  it("Should revert non-owner creating plans or withdrawing", async () => {
    const { piggyBank, other } = await loadFixture(deployFixture);

    await expect(
      piggyBank.connect(other).createETHSavingsPlan(60, { value: hre.ethers.parseEther("0.1") })
    ).to.be.revertedWithCustomError(piggyBank, "NOT_OWNER");

    await expect(piggyBank.connect(other).withdrawSavings(1)).to.be.revertedWithCustomError(piggyBank, "NOT_OWNER");
  });

  it("Owner should withdraw ETH penalties", async () => {
    const { factory, owner } = await loadFixture(deployFixture);

    // Send ETH penalty to factory
    await owner.sendTransaction({
      to: factory.getAddress(),
      value: hre.ethers.parseEther("0.05"),
    });

    const initialBalance = await hre.ethers.provider.getBalance(await owner.getAddress());

    const tx = await factory.withdrawPenaltiesETH();
    await tx.wait();

    const finalBalance = await hre.ethers.provider.getBalance(await owner.getAddress());

    expect(finalBalance).to.be.gt(initialBalance);
  });

});
