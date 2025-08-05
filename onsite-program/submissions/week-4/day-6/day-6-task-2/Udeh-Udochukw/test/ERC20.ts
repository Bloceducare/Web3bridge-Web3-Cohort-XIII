import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("ERC20 Token", function () {
  async function deployERC20Fixture() {
    const [owner, addr1, addr2] = await hre.ethers.getSigners();

    const TOKEN_NAME = "Test Token";
    const TOKEN_SYMBOL = "TEST";
    const TOKEN_DECIMALS = 18;
    const INITIAL_SUPPLY = hre.ethers.parseEther("1000");

    const ERC20Factory = await hre.ethers.getContractFactory("ERC20");
    const token = await ERC20Factory.deploy(
      TOKEN_NAME,
      TOKEN_SYMBOL,
      TOKEN_DECIMALS
    );
    await token.waitForDeployment();

    // Mint initial supply to owner
    await token.mint(owner.address, INITIAL_SUPPLY);

    return {
      token,
      owner,
      addr1,
      addr2,
      TOKEN_NAME,
      TOKEN_SYMBOL,
      TOKEN_DECIMALS,
      INITIAL_SUPPLY,
    };
  }

  it("Should deploy with correct metadata", async function () {
    const { token, TOKEN_NAME, TOKEN_SYMBOL, TOKEN_DECIMALS } =
      await loadFixture(deployERC20Fixture);

    expect(await token.name()).to.equal(TOKEN_NAME);
    expect(await token.symbol()).to.equal(TOKEN_SYMBOL);
    expect(await token.decimals()).to.equal(TOKEN_DECIMALS);
  });

  it("Should mint tokens correctly", async function () {
    const { token, addr1, INITIAL_SUPPLY } = await loadFixture(
      deployERC20Fixture
    );

    const mintAmount = hre.ethers.parseEther("100");
    await token.mint(addr1.address, mintAmount);

    expect(await token.balanceOf(addr1.address)).to.equal(mintAmount);
    expect(await token.totalSupply()).to.equal(INITIAL_SUPPLY + mintAmount);
  });

  it("Should burn tokens correctly", async function () {
    const { token, owner, INITIAL_SUPPLY } = await loadFixture(
      deployERC20Fixture
    );

    const burnAmount = hre.ethers.parseEther("100");
    await token.burn(owner.address, burnAmount);

    expect(await token.balanceOf(owner.address)).to.equal(
      INITIAL_SUPPLY - burnAmount
    );
    expect(await token.totalSupply()).to.equal(INITIAL_SUPPLY - burnAmount);
  });

  it("Should transfer tokens correctly", async function () {
    const { token, owner, addr1, INITIAL_SUPPLY } = await loadFixture(
      deployERC20Fixture
    );

    const transferAmount = hre.ethers.parseEther("100");
    await token.transfer(addr1.address, transferAmount);

    expect(await token.balanceOf(owner.address)).to.equal(
      INITIAL_SUPPLY - transferAmount
    );
    expect(await token.balanceOf(addr1.address)).to.equal(transferAmount);
  });

  it("Should approve allowances correctly", async function () {
    const { token, owner, addr1 } = await loadFixture(deployERC20Fixture);

    const approveAmount = hre.ethers.parseEther("100");
    await token.approve(addr1.address, approveAmount);

    expect(await token.allowance(owner.address, addr1.address)).to.equal(
      approveAmount
    );
  });
});
