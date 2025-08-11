import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, Signer } from "ethers";

describe("SavingsFactory + SavingsAccount", function () {
  let factory: Contract;
  let token: Contract;
  let owner: Signer;
  let user1: Signer;
  let user2: Signer;

  beforeEach(async () => {
    [owner, user1, user2] = await ethers.getSigners();


    const Token = await ethers.getContractFactory("TestToken");
    token = await Token.deploy("Test Token", "TTK", ethers.parseEther("1000000"));
    await token.waitForDeployment();

    const Factory = await ethers.getContractFactory("SavingsFactory");
    factory = await Factory.connect(owner).deploy();
    await factory.waitForDeployment();
  });

  it("should create an ETH savings account and deposit", async () => {
    const tx = await factory.connect(user1).createAccount(
      ethers.ZeroAddress,
      60, 
      { value: ethers.parseEther("1") }
    );
    const receipt = await tx.wait();
    const event = receipt.logs.find(log => log.fragment?.name === "AccountCreated");
    const accountAddr = event?.args?.accountAddress;

    expect(accountAddr).to.properAddress;

    const account = await ethers.getContractAt("SavingsAccount", accountAddr);
    const bal = await account.getBalance();
    expect(bal).to.equal(ethers.parseEther("1"));
  });

  it("should create an ERC20 savings account and deposit after creation", async () => {
    
    await token.connect(owner).transfer(await user2.getAddress(), ethers.parseEther("100"));

    const tx = await factory.connect(user2).createAccount(
      await token.getAddress(),
      60
    );
    const receipt = await tx.wait();
    const event = receipt.logs.find(log => log.fragment?.name === "AccountCreated");
    const accountAddr = event?.args?.accountAddress;

    const account = await ethers.getContractAt("SavingsAccount", accountAddr);

  
    await token.connect(user2).approve(accountAddr, ethers.parseEther("50"));
    await account.connect(user2).depositERC20(ethers.parseEther("50"));

    const bal = await account.getBalance();
    expect(bal).to.equal(ethers.parseEther("50"));
  });

  it("should withdraw after lock period with no fee", async () => {
    const tx = await factory.connect(user1).createAccount(
      ethers.ZeroAddress,
      1,
      { value: ethers.parseEther("1") }
    );
    const receipt = await tx.wait();
    const event = receipt.logs.find(log => log.fragment?.name === "AccountCreated");
    const accountAddr = event?.args?.accountAddress;
    const account = await ethers.getContractAt("SavingsAccount", accountAddr);


    await ethers.provider.send("evm_increaseTime", [2]);
    await ethers.provider.send("evm_mine", []);

    const beforeBal = await ethers.provider.getBalance(await user1.getAddress());
    const tx2 = await account.connect(user1).withdraw();
    const receipt2 = await tx2.wait();
    const afterBal = await ethers.provider.getBalance(await user1.getAddress());

    expect(afterBal).to.be.gt(beforeBal);
  });

  it("should withdraw early with 3% fee to admin", async () => {
    const tx = await factory.connect(user2).createAccount(
      ethers.ZeroAddress,
      1000,
      { value: ethers.parseEther("1") }
    );
    const receipt = await tx.wait();
    const event = receipt.logs.find(log => log.fragment?.name === "AccountCreated");
    const accountAddr = event?.args?.accountAddress;
    const account = await ethers.getContractAt("SavingsAccount", accountAddr);

    const adminAddr = await owner.getAddress();
    const adminBefore = await ethers.provider.getBalance(adminAddr);

    await account.connect(user2).withdraw();

    const adminAfter = await ethers.provider.getBalance(adminAddr);
    expect(adminAfter - adminBefore).to.equal(ethers.parseEther("0.03"));
  });

  it("should track total balance via factory", async () => {
    await factory.connect(user1).createAccount(
      ethers.ZeroAddress,
      60,
      { value: ethers.parseEther("1") }
    );
    await factory.connect(user1).createAccount(
      ethers.ZeroAddress,
      60,
      { value: ethers.parseEther("2") }
    );

    const totalBal = await factory.getUserTotalBalance(await user1.getAddress());
    expect(totalBal).to.equal(ethers.parseEther("3"));
  });
});
