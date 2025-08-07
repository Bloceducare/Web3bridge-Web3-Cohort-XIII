import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import hre from "hardhat";
import { Contract } from "ethers";
import { Signer } from "ethers";

describe("ERC20 functionality testing", function () {

  let contract: Contract;
  let owner: Signer;
  let addr1: Signer;
  let addr2: Signer;
  let name = "Rafikki";
  const tokenSymbol = "RFK";
  let totalSupply = 100_000_000;
  const tokenDecimals = 18;

  async function deployToken() {
    [owner, addr1, addr2] = await hre.ethers.getSigners();
    const ContractFactory = await hre.ethers.getContractFactory("ERC20");
    contract = await ContractFactory.deploy(
      name,
      tokenSymbol,
      tokenDecimals,
      totalSupply
    );
    return { contract, addr1, owner, addr2 };
  }

  describe("test name functionality", () => {
    it("tests name set is gotten", async () => {
      const { contract } = await loadFixture(deployToken);
      expect(await contract.name()).to.equal(name);
    });
  });
  describe("test symbol functionality", () => {
    it("tests symbol is gotten", async () => {
      const { contract } = await loadFixture(deployToken);
      expect(await contract.symbol()).to.equal(tokenSymbol);
    });
  });
  describe("test decimal functionality", () => {
    it("tests decimal is gotten", async () => {
      const { contract } = await loadFixture(deployToken);
      expect(await contract.decimals()).to.equal(tokenDecimals);
    });
  });
  describe("test totalSupply functionality", () => {
    it("tests totalSupply is gotten", async () => {
      const { contract } = await loadFixture(deployToken);
      expect(await contract.decimals()).to.equal(tokenDecimals);
    });
  });

  describe("test transfer and balanceOf functionality", () => {
   it("should revert if allowance is insufficient", async function () {
    const { contract, owner, addr1, addr2 } = await loadFixture(deployToken);

    await contract.buyToken(addr1.address, 100); // Give addr1 balance

    await contract.connect(addr1).approve(owner.address, 30);

    await expect(
      contract.connect(owner).transferFrom(addr1.address, addr2.address, 50)
    ).to.be.revertedWithCustomError(contract, "INSUFFICIENT_ALLOWANCE");
  });

  it("should revert if balance is insufficient", async function () {
    const { contract, owner, addr1, addr2 } = await loadFixture(deployToken);

    await contract.connect(addr1).approve(owner.address, 100);

    await expect(
      contract.connect(owner).transferFrom(addr1.address, addr2.address, 50)
    ).to.be.revertedWithCustomError(contract, "INSUFFICIENT_BALANCE");
  });

  it("should revert if both balance and allowance are insufficient", async function () {
    const { contract, addr1, addr2 } = await loadFixture(deployToken);

    await expect(
      contract.connect(addr2).transferFrom(addr1.address, addr2.address, 50)
    ).to.be.revertedWithCustomError(contract, "INSUFFICIENT_ALLOWANCE");
  });

  it("should transfer if balance and allowance are sufficient", async function () {
    const { contract, owner, addr1, addr2 } = await loadFixture(deployToken);

    await contract.connect(owner).approve(addr1.address, 200);
      await contract.buyToken(owner.address,1000);
    await contract.connect(addr1).transferFrom(owner.address, addr2.address, 150);
    expect(await contract.balanceOf(owner.address)).to.equal(850);
    expect(await contract.balanceOf(addr2.address)).to.equal(150);
    expect(
      await contract.allowance(owner.address, addr1.address)
    ).to.equal(50);
  });

  it("should allow full allowance transfer and reduce allowance to zero", async function () {
    const { contract, owner, addr1, addr2 } = await loadFixture(deployToken);

      await contract.connect(owner).approve(addr1.address, 100);
      await contract.buyToken(owner.address, 100);
    await contract.connect(addr1).transferFrom(owner.address, addr2.address, 100);

    expect(await contract.allowance(owner.address, addr1.address)).to.equal(0);
    expect(await contract.balanceOf(addr2.address)).to.equal(100);
  });

  it("should allow multiple partial transferFrom calls within allowance", async function () {
    const { contract, owner, addr1, addr2 } = await loadFixture(deployToken);

    await contract.connect(owner).approve(addr1.address, 100);
    await contract.buyToken(owner.address, 100);
    await contract.connect(addr1).transferFrom(owner.address, addr2.address, 40);
    await contract.connect(addr1).transferFrom(owner.address, addr2.address, 60);

    expect(await contract.allowance(owner.address, addr1.address)).to.equal(0);
    expect(await contract.balanceOf(addr2.address)).to.equal(100);
  });
  });
});
