import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("ERC20 Token", function () {
  async function deployTokenFixture() {
    const [owner, addr1, addr2] = await ethers.getSigners();

    const initialSupply = ethers.parseUnits("1000", 12); // 1000 tokens with 12 decimals
    const Token = await ethers.getContractFactory("ERC20");
    const token = await Token.deploy(initialSupply);

    return { token, owner, addr1, addr2, initialSupply };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { token, owner } = await loadFixture(deployTokenFixture);
      expect(await token.Owner()).to.equal(owner.address);
    });

    it("Should assign the total supply to the owner", async function () {
      const { token, owner, initialSupply } = await loadFixture(deployTokenFixture);
      const ownerBalance = await token.balanceOf(owner.address);
      expect(ownerBalance).to.equal(initialSupply);
    });
  });

  describe("Transfers", function () {
    it("Should transfer tokens between accounts", async function () {
      const { token, owner, addr1 } = await loadFixture(deployTokenFixture);

      await token.transfer(addr1.address, 1000);
      const addr1Balance = await token.balanceOf(addr1.address);
      expect(addr1Balance).to.equal(1000);
    });

    it("Should fail if sender doesn’t have enough tokens", async function () {
      const { token, addr1, addr2 } = await loadFixture(deployTokenFixture);

      await expect(
        token.connect(addr1).transfer(addr2.address, 1000)
      ).to.be.revertedWith("Insufficient balance");
    });
  });

  describe("Approvals", function () {
    it("Owner can approve another address to spend", async function () {
      const { token, owner, addr1 } = await loadFixture(deployTokenFixture);

      await token.approve(addr1.address, 5000);
      const allowance = await token.allowance(owner.address, addr1.address);
      expect(allowance).to.equal(5000);
    });

    it("Non-owner cannot approve (due to onlyme modifier)", async function () {
      const { token, addr1, addr2 } = await loadFixture(deployTokenFixture);

      await expect(
        token.connect(addr1).approve(addr2.address, 1000)
      ).to.be.revertedWith("Not For YOU");
    });
  });

  describe("Allowance + transferFrom", function () {
    it("Should allow approved spender to transfer tokens", async function () {
      const { token, owner, addr1, addr2 } = await loadFixture(deployTokenFixture);

      await token.approve(addr1.address, 1000);
      await token.connect(addr1).transferFrom(owner.address, addr2.address, 1000);

      const balance = await token.balanceOf(addr2.address);
      expect(balance).to.equal(1000);

      const remaining = await token.allowance(owner.address, addr1.address);
      expect(remaining).to.equal(0);
    });

    it("Should fail if trying to transfer more than allowance", async function () {
      const { token, owner, addr1 } = await loadFixture(deployTokenFixture);

      await token.approve(addr1.address, 500);
      await expect(
        token.connect(addr1).transferFrom(owner.address, addr1.address, 1000)
      ).to.be.revertedWith("Allowance exceeded");
    });
  });

  describe("Mint & Burn", function () {
    it("Should mint tokens to owner", async function () {
      const { token, owner } = await loadFixture(deployTokenFixture);

      const amount = 5000;
      await token.mint(amount);

      const balance = await token.balanceOf(owner.address);
      expect(balance).to.equal(await token.totalSupply());
    });

    it("Should burn tokens from owner", async function () {
      const { token, owner } = await loadFixture(deployTokenFixture);

      const supplyBefore = await token.totalSupply();
      await token.burn(1000);
      const supplyAfter = await token.totalSupply();

      expect(supplyAfter).to.equal(supplyBefore - 1000n);
    });

    it("Should fail if non-owner tries to mint or burn", async function () {
      const { token, addr1 } = await loadFixture(deployTokenFixture);

      await expect(token.connect(addr1).mint(1000)).to.be.revertedWith("Not For YOU");
      await expect(token.connect(addr1).burn(1000)).to.be.revertedWith("Not For YOU");
    });
  });
});
