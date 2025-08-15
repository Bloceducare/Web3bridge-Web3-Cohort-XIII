import { expect } from "chai";
import hre from "hardhat";

describe("FactorySavings & PiggyBank", function () {
  it("Should create ETH bank", async function () {
    const [owner] = await hre.ethers.getSigners();
    const Factory = await hre.ethers.getContractFactory("FactorySavings");
    const factory = await Factory.deploy();
    await factory.createBank("ETH savings", hre.ethers.ZeroAddress, hre.ethers.parseEther("1"), 1000, { value: hre.ethers.parseEther("1") });
    const banks = await factory.getUserBanks(owner.address);
    expect(banks.length).to.equal(1);
    expect(banks[0].bankName).to.equal("ETH savings");
  });

  it("Should create Token bank", async function () {
    const [owner] = await hre.ethers.getSigners();
    const Token = await hre.ethers.getContractFactory("TokenT");
    const token = await Token.deploy("Test Token", "TTK", hre.ethers.parseEther("1000"), owner.address);
    const Factory = await hre.ethers.getContractFactory("FactorySavings");
    const factory = await Factory.deploy();
    await token.approve(factory.target, hre.ethers.parseEther("5"));
    await factory.createBank("Token Bank", token.target, hre.ethers.parseEther("5"), 1000);
    const banks = await factory.getUserBanks(owner.address);
    expect(banks.length).to.equal(1);
    expect(banks[0].bankName).to.equal("Token Bank");
  });

  it("Should join ETH bank", async function () {
    const [owner, user] = await hre.ethers.getSigners();
    const Factory = await hre.ethers.getContractFactory("FactorySavings");
    const factory = await Factory.deploy();
    await factory.createBank("Join ETH", hre.ethers.ZeroAddress, hre.ethers.parseEther("1"), 1000, { value: hre.ethers.parseEther("1") });
    await factory.connect(user).joinBank(owner.address, 0, hre.ethers.parseEther("1"), { value: hre.ethers.parseEther("1") });
    const totalBanks = await factory.getTotalBanks(owner.address);
    expect(totalBanks).to.equal(1);
  });

//   it("Should join Token bank", async function () {
//     const [owner, user] = await hre.ethers.getSigners();
//     const Token = await hre.ethers.getContractFactory("TokenT");
//     const token = await Token.deploy("Test Token", "TTK", hre.ethers.parseEther("1000"), owner.address);
//     const Factory = await hre.ethers.getContractFactory("FactorySavings");
//     const factory = await Factory.deploy();
//     await token.approve(factory.target, hre.ethers.parseEther("5"));
//     await factory.createBank("Join Token", token.target, hre.ethers.parseEther("5"), 1000);
//     await token.transfer(user.address, hre.ethers.parseEther("5"));

//     const banks = await factory.getUserBanks(owner.address);
//     await token.connect(user).approve(banks[0].bankAddress, hre.ethers.parseEther("5"));

//     await factory.connect(user).joinBank(owner.address, 0, hre.ethers.parseEther("5"));
//     const totalBanks = await factory.getTotalBanks(owner.address);
//     expect(totalBanks).to.equal(1);
//   });

  it("Should return correct total banks", async function () {
    const [owner] = await hre.ethers.getSigners();
    const Factory = await hre.ethers.getContractFactory("FactorySavings");
    const factory = await Factory.deploy();
    await factory.createBank("Bank 1", hre.ethers.ZeroAddress, hre.ethers.parseEther("1"), 1000, { value: hre.ethers.parseEther("1") });
    await factory.createBank("Bank 2", hre.ethers.ZeroAddress, hre.ethers.parseEther("1"), 1000, { value: hre.ethers.parseEther("1") });
    const total = await factory.getTotalBanks(owner.address);
    expect(total).to.equal(2);
  });
});
