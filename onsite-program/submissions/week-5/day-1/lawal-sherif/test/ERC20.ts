import { expect } from "chai";
import { ethers } from "hardhat";

describe("Younique ERC20 Token", function () {
  const MAX_SUPPLY = ethers.parseUnits("1000000", 18); // 1 million tokens

  async function deployTokenFixture() {
    const [owner, addr1, addr2] = await ethers.getSigners();

    const ERC20 = await ethers.getContractFactory("ERC20");
    const token = await ERC20.deploy(MAX_SUPPLY);

    return { token, owner, addr1, addr2 };
  }

  describe("Deployment", function () {
    it("Should set the correct name, symbol, decimals and owner", async function () {
      const { token, owner } = await deployTokenFixture();

      expect(await token.name()).to.equal("Younique");
      expect(await token.symbol()).to.equal("YNQ");
      expect(await token.decimals()).to.equal(18);
      expect(await token.owner()).to.equal(owner.address);
    });
  });

  describe("Minting", function () {
    it("Should allow only owner to mint tokens", async function () {
      const { token, owner, addr1 } = await deployTokenFixture();

      const mintAmount = ethers.parseUnits("1000", 18);
      await token.mint(mintAmount);

      expect(await token.totalSupply()).to.equal(mintAmount);
      expect(await token.balanceOf(owner.address)).to.equal(mintAmount);

      // Non-owner can't mint
      await expect(token.connect(addr1).mint(mintAmount)).to.be.revertedWith(
        "Only owner can call this"
      );
    });

    it("Should not allow minting beyond maxSupply", async function () {
      const { token } = await deployTokenFixture();

      const tooMuch = MAX_SUPPLY + 1n;

      await expect(token.mint(tooMuch)).to.be.revertedWith(
        "Would exceed max supply"
      );
    });
  });

  describe("Transfers", function () {
    it("Should transfer tokens successfully", async function () {
      const { token, owner, addr1 } = await deployTokenFixture();

      const amount = ethers.parseUnits("500", 18);
      await token.mint(amount);
      await token.transfer(addr1.address, amount);

      expect(await token.balanceOf(addr1.address)).to.equal(amount);
      expect(await token.balanceOf(owner.address)).to.equal(0);
    });

    it("Should not transfer if contract is paused", async function () {
      const { token, addr1 } = await deployTokenFixture();

      const amount = ethers.parseUnits("100", 18);
      await token.mint(amount);
      await token.pause_transfers();

      await expect(token.transfer(addr1.address, amount)).to.be.revertedWith(
        "Contract is paused"
      );
    });
  });

  describe("Approvals & transferFrom", function () {
    it("Should approve and allow delegated transfers", async function () {
      const { token, owner, addr1, addr2 } = await deployTokenFixture();

      const amount = ethers.parseUnits("100", 18);
      await token.mint(amount);

      await token.approve(addr1.address, amount);

      expect(await token.allowance(owner.address, addr1.address)).to.equal(
        amount
      );

      await token
        .connect(addr1)
        .transferFrom(owner.address, addr2.address, amount);

      expect(await token.balanceOf(addr2.address)).to.equal(amount);
      expect(await token.allowance(owner.address, addr1.address)).to.equal(0);
    });

    it("Should not allow transferFrom if paused", async function () {
      const { token, owner, addr1, addr2 } = await deployTokenFixture();

      const amount = ethers.parseUnits("50", 18);
      await token.mint(amount);
      await token.approve(addr1.address, amount);
      await token.pause_transfers();

      await expect(
        token.connect(addr1).transferFrom(owner.address, addr2.address, amount)
      ).to.be.revertedWith("Contract is paused");
    });
  });

  describe("Burning tokens", function () {
    it("Should burn tokens and decrease total supply", async function () {
      const { token, owner } = await deployTokenFixture();

      const mintAmount = ethers.parseUnits("200", 18);
      const burnAmount = ethers.parseUnits("50", 18);

      await token.mint(mintAmount);
      await token.burn(burnAmount);

      expect(await token.balanceOf(owner.address)).to.equal(
        mintAmount - burnAmount
      );
      expect(await token.totalSupply()).to.equal(mintAmount - burnAmount);
    });

    it("Should fail if trying to burn more than balance", async function () {
      const { token } = await deployTokenFixture();

      const amount = ethers.parseUnits("1", 18);
      await expect(token.burn(amount)).to.be.revertedWith(
        "Insufficient balance to burn"
      );
    });
  });

  describe("Pause and Unpause", function () {
    it("Should allow only owner to pause/unpause", async function () {
      const { token, addr1 } = await deployTokenFixture();

      await expect(token.connect(addr1).pause_transfers()).to.be.revertedWith(
        "Only owner can call this"
      );

      await token.pause_transfers();
      expect(await token.paused()).to.be.true;

      await token.unpause_transfers();
      expect(await token.paused()).to.be.false;
    });
  });
});
