import { ethers } from "hardhat";
import { expect } from "chai";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { ERC20Factory, ERC20Factory__factory, ERC20, ERC20__factory } from "../typechain-types";

describe("ERC20Factory Contract", function () {
  let ERC20Factory: ERC20Factory__factory;
  let erc20Factory: ERC20Factory;
  let owner: SignerWithAddress;
  const name = "MyToken";
  const symbol = "MTK";
  const decimals = 18;
  const initialSupply = ethers.parseUnits("1000000", decimals);

  beforeEach(async function () {
    [owner] = await ethers.getSigners();
    ERC20Factory = await ethers.getContractFactory("ERC20Factory");
    erc20Factory = await ERC20Factory.deploy();
    await erc20Factory.waitForDeployment();
  });

  it("should deploy a new ERC20 contract", async function () {
    const tx = await erc20Factory.deployERC20(name, symbol, decimals, initialSupply);
    const receipt = await tx.wait();
    const event = receipt?.logs.find(log => log.fragment?.name === "ERC20Deployed");
    const tokenAddress = event?.args[0];
    
    const token = ERC20__factory.connect(tokenAddress, owner);
    expect(await token.name()).to.equal(name);
    expect(await token.symbol()).to.equal(symbol);
    expect(await token.decimals()).to.equal(decimals);
    expect(await token.get_total_supply()).to.equal(initialSupply);
    expect(await token.balanceOf(owner.address)).to.equal(initialSupply);

    await expect(tx)
      .to.emit(erc20Factory, "ERC20Deployed")
      .withArgs(tokenAddress, name, symbol);
  });
});