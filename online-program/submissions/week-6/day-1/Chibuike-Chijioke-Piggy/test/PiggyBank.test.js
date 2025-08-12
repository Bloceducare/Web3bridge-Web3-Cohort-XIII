const { ethers } = require("hardhat");
const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");

describe("PiggyBankFactory", function () {
  async function deployFixture() {
    const [owner, user, other] = await ethers.getSigners();

    const Factory = await ethers.getContractFactory("PiggyBankFactory");
    const factory = await Factory.deploy();
    await factory.waitForDeployment();

    const Token = await ethers.getContractFactory("MockERC20");
    const token = await Token.deploy("MockToken", "MTK");

    await token.connect(owner).mint(user.address, ethers.parseEther("100"));

    return { factory, owner, user, other, erc20: token };
  }

  // This test for vault creation
  it("should allow user to create a vault", async () => {
    const { factory, user } = await loadFixture(deployFixture);
    await factory
      .connect(user)
      .createPiggyVault(3600, false, ethers.ZeroAddress);
    const vaults = await factory.getUserVaults(user.address);
    expect(vaults.length).to.equal(1);
  });

  // This test for ETH Deposit
  it("should accept ETH deposits", async () => {
    const { factory, user } = await loadFixture(deployFixture);
    await factory
      .connect(user)
      .createPiggyVault(3600, false, ethers.ZeroAddress);
    const vaults = await factory.getUserVaults(user.address);
    const vaultAddress = vaults[0].vaultAddress;

    const vaultContract = await ethers.getContractAt(
      "PiggyBankSaving",
      vaultAddress
    );
    await vaultContract
      .connect(user)
      .deposit(ethers.parseEther("1"), { value: ethers.parseEther("1") });

    const balance = await vaultContract.getPiggyVaultBalance();
    expect(balance).to.equal(ethers.parseEther("1"));
  });

  // This test for ERC20 Deposit
  it("should accept ERC20 deposits", async () => {
    const { factory, user, erc20 } = await loadFixture(deployFixture);
    await factory.connect(user).createPiggyVault(3600, true, erc20.target);
    const vaults = await factory.getUserVaults(user.address);
    const vaultAddress = vaults[0].vaultAddress;

    const vaultContract = await ethers.getContractAt(
      "PiggyBankSaving",
      vaultAddress
    );
    await erc20.connect(user).approve(vaultAddress, ethers.parseEther("50"));
    await vaultContract.connect(user).deposit(ethers.parseEther("50"));

    const balance = await vaultContract.getPiggyVaultBalance();
    expect(balance).to.equal(ethers.parseEther("50"));
  });

  // This test for ERC20 withdrawal after lock
  it("should allow ERC20 withdrawal after lock", async () => {
    const { factory, user, erc20 } = await loadFixture(deployFixture);
    await factory.connect(user).createPiggyVault(1, true, erc20.target);
    const vaults = await factory.getUserVaults(user.address);
    const vaultAddress = vaults[0].vaultAddress;

    const vaultContract = await ethers.getContractAt(
      "PiggyBankSaving",
      vaultAddress
    );
    await erc20.connect(user).approve(vaultAddress, ethers.parseEther("50"));
    await vaultContract.connect(user).deposit(ethers.parseEther("50"));

    await ethers.provider.send("evm_increaseTime", [2]);
    await ethers.provider.send("evm_mine");

    await vaultContract.connect(user).withdraw();
    const balance = await erc20.balanceOf(user.address);
    expect(balance).to.be.gt(ethers.parseEther("89"));
  });

  // This test for ETH withdrawal after lock
  it("should allow ETH withdrawal after lock", async () => {
    const { factory, user } = await loadFixture(deployFixture);
    await factory.connect(user).createPiggyVault(1, false, ethers.ZeroAddress);
    const vaults = await factory.getUserVaults(user.address);
    const vaultAddress = vaults[0].vaultAddress;

    const vaultContract = await ethers.getContractAt(
      "PiggyBankSaving",
      vaultAddress
    );
    await vaultContract
      .connect(user)
      .deposit(ethers.parseEther("2"), { value: ethers.parseEther("2") });

    await ethers.provider.send("evm_increaseTime", [2]);
    await ethers.provider.send("evm_mine");

    const before = await ethers.provider.getBalance(user.address);
    const tx = await vaultContract.connect(user).withdraw();
    const receipt = await tx.wait();
    const gasUsed = receipt.gasUsed * receipt.gasPrice;

    const after = await ethers.provider.getBalance(user.address);
    expect(after).to.be.gt(before - gasUsed);
  });

  // This test shows how non-owners are prevented from withdrawing
  it("should prevent non-owner from withdrawing", async () => {
    const { factory, user, other } = await loadFixture(deployFixture);
    await factory
      .connect(user)
      .createPiggyVault(3600, false, ethers.ZeroAddress);
    const vaults = await factory.getUserVaults(user.address);
    const vaultAddress = vaults[0].vaultAddress;

    const vaultContract = await ethers.getContractAt(
      "PiggyBankSaving",
      vaultAddress
    );
    await vaultContract
      .connect(user)
      .deposit(ethers.parseEther("1"), { value: ethers.parseEther("1") });

    await expect(
      vaultContract.connect(other).withdraw()
    ).to.be.revertedWithCustomError(vaultContract, "NotVaultOwner");
  });
});
