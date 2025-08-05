import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { ethers } from "hardhat";
import { expect } from "chai";

describe("Trinnode Token", function () {
  async function deployTrinnodeFixture() {
    const [owner, addr1, addr2] = await ethers.getSigners();

    const Trinnode = await ethers.getContractFactory("Trinnode");
    const trinnode = await Trinnode.deploy();
    await trinnode.initialize("TrinNODE", "TRN", 18, 1000, 10000);

    return { trinnode, owner, addr1, addr2 };
  }

  it("Should initialize correctly", async function () {
    const { trinnode, owner } = await loadFixture(deployTrinnodeFixture);

    expect(await trinnode.name()).to.equal("TrinNODE");
    expect(await trinnode.symbol()).to.equal("TRN");
    expect(await trinnode.decimals()).to.equal(18);
    expect(await trinnode.totalSupply()).to.equal(1000);
    expect(await trinnode.balanceOf(owner.address)).to.equal(1000);
  });

  it("Should revert if trying to initialize twice", async function () {
    const { trinnode } = await loadFixture(deployTrinnodeFixture);

    await expect(
      trinnode.initialize("TrinNODE", "TRN", 18, 1000, 5000)
    ).to.be.revertedWithCustomError(trinnode, "ALREADY_INITIALIZED");
  });

  it("Should transfer tokens between accounts", async function () {
    const { trinnode, owner, addr1 } = await loadFixture(deployTrinnodeFixture);

    await trinnode.transfer(addr1.address, 200);

    expect(await trinnode.balanceOf(addr1.address)).to.equal(200);
    expect(await trinnode.balanceOf(owner.address)).to.equal(800);
  });

  it("Should revert if transfer is more than balance", async function () {
    const { trinnode, addr1, addr2 } = await loadFixture(deployTrinnodeFixture);

    await expect(
      trinnode.connect(addr1).transfer(addr2.address, 100)
    ).to.be.revertedWithCustomError(trinnode, "INSUFFICIENT_BALANCE");
  });

  it("Should approve and allow transferFrom", async function () {
    const { trinnode, addr1, addr2 } = await loadFixture(deployTrinnodeFixture);

    await trinnode.transfer(addr1.address, 300);
    await trinnode.connect(addr1).approve(addr2.address, 100);
    await trinnode.connect(addr2).transferFrom(addr1.address, addr2.address, 100);

    expect(await trinnode.balanceOf(addr2.address)).to.equal(100);
    expect(await trinnode.balanceOf(addr1.address)).to.equal(200);
  });

  it("Should revert if allowance is too low", async function () {
    const { trinnode, addr1, addr2 } = await loadFixture(deployTrinnodeFixture);

    await trinnode.transfer(addr1.address, 50);
    await trinnode.connect(addr1).approve(addr2.address, 10);

    await expect(
      trinnode.connect(addr2).transferFrom(addr1.address, addr2.address, 20)
    ).to.be.revertedWithCustomError(trinnode, "INSUFFICIENT_ALLOWANCE");
  });

  it("Should allow minting by owner only", async function () {
    const { trinnode, addr1 } = await loadFixture(deployTrinnodeFixture);

    await trinnode.mint(addr1.address, 500);

    expect(await trinnode.balanceOf(addr1.address)).to.equal(500);
  });

  it("Should revert mint if not owner", async function () {
    const { trinnode, addr1 } = await loadFixture(deployTrinnodeFixture);

    await expect(
      trinnode.connect(addr1).mint(addr1.address, 100)
    ).to.be.revertedWithCustomError(trinnode, "UNAUTHORIZED");
  });

  it("Should burn tokens correctly", async function () {
    const { trinnode } = await loadFixture(deployTrinnodeFixture);

    await trinnode.burn(400);

    expect(await trinnode.totalSupply()).to.equal(600);
  });
});