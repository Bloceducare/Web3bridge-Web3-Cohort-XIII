import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { parseUnits } from "ethers";
import { ERC20, ERC20__factory } from "../typechain-types";

describe("Simon's ERC20 Token", function () {
  let token: ERC20;
  let owner: any;
  let addr1: any;
  let addr2: any;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    const factory = (await ethers.getContractFactory("ERC20")) as ERC20__factory;
    const deployed = await factory.deploy();
    await deployed.waitForDeployment(); // ✅ ethers v6 compatible
    token = deployed as unknown as ERC20;
  });

  it("should mint tokens correctly", async function () {
    await token.connect(owner).mint(parseUnits("1000", 18));
    const balance = await token.balanceOf(owner.address);
    expect(balance).to.equal(parseUnits("1000", 18));
    expect(await token.totalSupply()).to.equal(balance);
  });

  it("should transfer tokens", async function () {
    await token.connect(owner).mint(parseUnits("500", 18));
    await token.connect(owner).transfer(addr1.address, parseUnits("200", 18));

    const balance1 = await token.balanceOf(addr1.address);
    expect(balance1).to.equal(parseUnits("200", 18));
  });

  it("should approve and transferFrom", async function () {
    await token.connect(owner).mint(parseUnits("1000", 18));

    await token.connect(owner).approve(addr1.address, parseUnits("300", 18));
    const allowance = await token.allowance(owner.address, addr1.address);
    expect(allowance).to.equal(parseUnits("300", 18));

    await token.connect(addr1).transferFrom(
      owner.address,
      addr2.address,
      parseUnits("150", 18)
    );

    const balance2 = await token.balanceOf(addr2.address);
    expect(balance2).to.equal(parseUnits("150", 18));
  });

  it("should burn tokens", async function () {
    await token.connect(owner).mint(parseUnits("500", 18));
    await token.connect(owner).burn(parseUnits("200", 18));

    const balance = await token.balanceOf(owner.address);
    expect(balance).to.equal(parseUnits("300", 18));

    const total = await token.totalSupply();
    expect(total).to.equal(parseUnits("300", 18));
  });
});
