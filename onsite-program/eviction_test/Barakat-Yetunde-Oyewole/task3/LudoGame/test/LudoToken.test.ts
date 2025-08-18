import { expect } from "chai";
import { ethers } from "hardhat";
import { LudoToken } from "../typechain-types";

describe("LudoToken", function () {
  let ludoToken: LudoToken;
  let owner: any;
  let addr1: any;

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();
    
    const LudoToken = await ethers.getContractFactory("LudoToken");
    ludoToken = await LudoToken.deploy();
    await ludoToken.waitForDeployment();
  });

  it("Should have correct name and symbol", async function () {
    expect(await ludoToken.name()).to.equal("LudoToken");
    expect(await ludoToken.symbol()).to.equal("LUDO");
  });

  it("Should mint initial supply to owner", async function () {
    const expectedSupply = ethers.parseEther("1000000");
    expect(await ludoToken.balanceOf(owner.address)).to.equal(expectedSupply);
  });

  it("Should allow owner to mint tokens", async function () {
    const mintAmount = ethers.parseEther("1000");
    await ludoToken.mint(addr1.address, mintAmount);
    expect(await ludoToken.balanceOf(addr1.address)).to.equal(mintAmount);
  });
});