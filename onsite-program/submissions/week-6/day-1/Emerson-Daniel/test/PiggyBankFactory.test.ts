import { expect } from "chai";
import { ethers } from "hardhat";

describe("PiggyBank", function () {
  let piggy: any;
  let mockERC20: any;
  let owner: any;
  let user: any;
  let admin: any;

  beforeEach(async function () {
    [owner, user, admin] = await ethers.getSigners();
    const Piggy = await ethers.getContractFactory("PiggyBank");
    piggy = await Piggy.deploy(user.address, 3600, admin.address); // 1 hour lock

    const Mock = await ethers.getContractFactory("MockERC20");
    mockERC20 = await Mock.deploy();
    await mockERC20.mint(user.address, ethers.parseUnits("1000", 18));
  });

  it("Should deposit and get balance (ETH)", async function () {
    await piggy.connect(user).deposit(ethers.ZeroAddress, ethers.parseEther("1.0"), { value: ethers.parseEther("1.0") });
    expect(await piggy.getBalance(ethers.ZeroAddress)).to.equal(ethers.parseEther("1.0"));
  });

  it("Should deposit and get balance (ERC20)", async function () {
    await mockERC20.connect(user).approve(piggy.target, ethers.parseUnits("100", 18));
    await piggy.connect(user).deposit(mockERC20.target, ethers.parseUnits("100", 18));
    expect(await piggy.getBalance(mockERC20.target)).to.equal(ethers.parseUnits("100", 18));
  });

  it("Should withdraw after lock (no fee)", async function () {
    await piggy.connect(user).deposit(ethers.ZeroAddress, ethers.parseEther("1.0"), { value: ethers.parseEther("1.0") });

    // Advance time
    await ethers.provider.send("evm_increaseTime", [3601]);
    await ethers.provider.send("evm_mine", []);

    const userBalBefore = await ethers.provider.getBalance(user.address);
    await piggy.connect(user).withdraw(ethers.ZeroAddress, ethers.parseEther("1.0"));
    const userBalAfter = await ethers.provider.getBalance(user.address);

    expect(userBalAfter).to.be.greaterThan(userBalBefore); // Received back, minus gas
    expect(await piggy.getBalance(ethers.ZeroAddress)).to.equal(0);
  });

  it("Should withdraw early with fee (ETH)", async function () {
    await piggy.connect(user).deposit(ethers.ZeroAddress, ethers.parseEther("1.0"), { value: ethers.parseEther("1.0") });

    const adminBalBefore = await ethers.provider.getBalance(admin.address);
    await piggy.connect(user).withdraw(ethers.ZeroAddress, ethers.parseEther("1.0"));
    const adminBalAfter = await ethers.provider.getBalance(admin.address);

    expect(adminBalAfter - adminBalBefore).to.equal(ethers.parseEther("0.03")); // 3% fee
    expect(await piggy.getBalance(ethers.ZeroAddress)).to.equal(0);
  });

  it("Should withdraw early with fee (ERC20)", async function () {
    await mockERC20.connect(user).approve(piggy.target, ethers.parseUnits("100", 18));
    await piggy.connect(user).deposit(mockERC20.target, ethers.parseUnits("100", 18));

    const adminBalBefore = await mockERC20.balanceOf(admin.address);
    await piggy.connect(user).withdraw(mockERC20.target, ethers.parseUnits("100", 18));
    const adminBalAfter = await mockERC20.balanceOf(admin.address);

    expect(adminBalAfter - adminBalBefore).to.equal(ethers.parseUnits("3", 18)); // 3% fee
    expect(await piggy.getBalance(mockERC20.target)).to.equal(0);
  });

  it("Should revert unauthorized actions", async function () {
    await expect(piggy.connect(owner).deposit(ethers.ZeroAddress, 1, { value: 1 })).to.be.revertedWith("Only owner");
    await expect(piggy.connect(owner).withdraw(ethers.ZeroAddress, 1)).to.be.revertedWith("Only owner");
  });
});