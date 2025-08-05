
import { expect } from "chai";
import hre from "hardhat";

describe("AMAS Token Contract", function () {
  const TOTAL_SUPPLY = 1_000_000_000_000_000_000_000n;

  describe("Deployment", function () {
    it("Should set correct token details", async function () {
      const AMASFactory = await hre.ethers.getContractFactory("AMAS");
      const amas = await AMASFactory.deploy();

      expect(await amas.symbol()).to.equal("AMS");
      expect(await amas.name()).to.equal("Amas Coin");
      expect(await amas.decimals()).to.equal(18);
      expect(await amas.totalsupply()).to.equal(TOTAL_SUPPLY);
    });

    it("Should give all tokens to deployer", async function () {
      const [owner] = await hre.ethers.getSigners();
      const AMASFactory = await hre.ethers.getContractFactory("AMAS");
      const amas = await AMASFactory.deploy();

      const balance = await amas.balanceOf(owner.address);
      expect(balance).to.equal(TOTAL_SUPPLY);
    });
  });

  describe("Transfer", function () {
    it("Should transfer tokens", async function () {
      const [owner, user1] = await hre.ethers.getSigners();
      const AMASFactory = await hre.ethers.getContractFactory("AMAS");
      const amas = await AMASFactory.deploy();

      const amount = 1000n;
      await amas.transfer(user1.address, amount);

      expect(await amas.balanceOf(user1.address)).to.equal(amount);
      expect(await amas.balanceOf(owner.address)).to.equal(TOTAL_SUPPLY - amount);
    });

    it("Should fail with insufficient balance", async function () {
      const [owner, user1] = await hre.ethers.getSigners();
      const AMASFactory = await hre.ethers.getContractFactory("AMAS");
      const amas = await AMASFactory.deploy();

      const amount = TOTAL_SUPPLY + 1n;
      await expect(amas.transfer(user1.address, amount))
        .to.be.revertedWith("Insufficient balance");
    });

    it("Should fail transfer to zero address", async function () {
      const AMASFactory = await hre.ethers.getContractFactory("AMAS");
      const amas = await AMASFactory.deploy();

      await expect(amas.transfer(hre.ethers.ZeroAddress, 100n))
        .to.be.revertedWith("Invalid address");
    });

    it("Should emit Transfer event", async function () {
      const [owner, user1] = await hre.ethers.getSigners();
      const AMASFactory = await hre.ethers.getContractFactory("AMAS");
      const amas = await AMASFactory.deploy();

      const amount = 500n;
      await expect(amas.transfer(user1.address, amount))
        .to.emit(amas, "Transfer")
        .withArgs(owner.address, user1.address, amount);
    });
  });

  describe("Approve", function () {
    it("Should approve tokens", async function () {
      const [owner, spender] = await hre.ethers.getSigners();
      const AMASFactory = await hre.ethers.getContractFactory("AMAS");
      const amas = await AMASFactory.deploy();

      const amount = 1000n;
      await amas.approve(spender.address, amount);

      expect(await amas.allowance(owner.address, spender.address)).to.equal(amount);
    });

    it("Should emit Approval event", async function () {
      const [owner, spender] = await hre.ethers.getSigners();
      const AMASFactory = await hre.ethers.getContractFactory("AMAS");
      const amas = await AMASFactory.deploy();

      const amount = 500n;
      await expect(amas.approve(spender.address, amount))
        .to.emit(amas, "Approval")
        .withArgs(owner.address, spender.address, amount);
    });

    it("Should overwrite previous approval", async function () {
      const [owner, spender] = await hre.ethers.getSigners();
      const AMASFactory = await hre.ethers.getContractFactory("AMAS");
      const amas = await AMASFactory.deploy();

      await amas.approve(spender.address, 100n);
      await amas.approve(spender.address, 200n);

      expect(await amas.allowance(owner.address, spender.address)).to.equal(200n);
    });
  });

  describe("TransferFrom", function () {
    it("Should transfer from approved account", async function () {
      const [owner, spender, recipient] = await hre.ethers.getSigners();
      const AMASFactory = await hre.ethers.getContractFactory("AMAS");
      const amas = await AMASFactory.deploy();

      const approveAmount = 1000n;
      const transferAmount = 600n;

      await amas.approve(spender.address, approveAmount);
      await amas.connect(spender).transferFrom(owner.address, recipient.address, transferAmount);

      expect(await amas.balanceOf(recipient.address)).to.equal(transferAmount);
      expect(await amas.balanceOf(owner.address)).to.equal(TOTAL_SUPPLY - transferAmount);
      expect(await amas.allowance(owner.address, spender.address)).to.equal(approveAmount - transferAmount);
    });

    it("Should fail when allowance exceeded", async function () {
      const [owner, spender, recipient] = await hre.ethers.getSigners();
      const AMASFactory = await hre.ethers.getContractFactory("AMAS");
      const amas = await AMASFactory.deploy();

      await amas.approve(spender.address, 100n);

      await expect(amas.connect(spender).transferFrom(owner.address, recipient.address, 200n))
        .to.be.revertedWith("Allowance exceeded");
    });

    it("Should fail when balance insufficient", async function () {
      const [owner, spender, recipient, other] = await hre.ethers.getSigners();
      const AMASFactory = await hre.ethers.getContractFactory("AMAS");
      const amas = await AMASFactory.deploy();

      // Transfer almost all tokens away
      await amas.transfer(other.address, TOTAL_SUPPLY - 50n);

      // Approve more than remaining balance
      await amas.approve(spender.address, 100n);

      await expect(amas.connect(spender).transferFrom(owner.address, recipient.address, 100n))
        .to.be.revertedWith("Insufficient balance");
    });

    it("Should fail transfer to zero address", async function () {
      const [owner, spender] = await hre.ethers.getSigners();
      const AMASFactory = await hre.ethers.getContractFactory("AMAS");
      const amas = await AMASFactory.deploy();

      await amas.approve(spender.address, 100n);

      await expect(amas.connect(spender).transferFrom(owner.address, hre.ethers.ZeroAddress, 50n))
        .to.be.revertedWith("Invalid address");
    });

    it("Should emit Transfer event", async function () {
      const [owner, spender, recipient] = await hre.ethers.getSigners();
      const AMASFactory = await hre.ethers.getContractFactory("AMAS");
      const amas = await AMASFactory.deploy();

      await amas.approve(spender.address, 500n);

      await expect(amas.connect(spender).transferFrom(owner.address, recipient.address, 300n))
        .to.emit(amas, "Transfer")
        .withArgs(owner.address, recipient.address, 300n);
    });
  });

  describe("View Functions", function () {
    it("Should return correct balances", async function () {
      const [owner, user1] = await hre.ethers.getSigners();
      const AMASFactory = await hre.ethers.getContractFactory("AMAS");
      const amas = await AMASFactory.deploy();

      expect(await amas.balanceOf(owner.address)).to.equal(TOTAL_SUPPLY);
      expect(await amas.balanceOf(user1.address)).to.equal(0);

      await amas.transfer(user1.address, 500n);

      expect(await amas.balanceOf(owner.address)).to.equal(TOTAL_SUPPLY - 500n);
      expect(await amas.balanceOf(user1.address)).to.equal(500n);
    });

    it("Should return correct allowances", async function () {
      const [owner, spender] = await hre.ethers.getSigners();
      const AMASFactory = await hre.ethers.getContractFactory("AMAS");
      const amas = await AMASFactory.deploy();

      expect(await amas.allowance(owner.address, spender.address)).to.equal(0);

      await amas.approve(spender.address, 300n);
      expect(await amas.allowance(owner.address, spender.address)).to.equal(300n);
    });

    it("Should return correct total supply", async function () {
      const AMASFactory = await hre.ethers.getContractFactory("AMAS");
      const amas = await AMASFactory.deploy();

      expect(await amas.totalsupply()).to.equal(TOTAL_SUPPLY);
    });
  });

  describe("Edge Cases", function () {
    it("Should handle zero amount transfers", async function () {
      const [owner, user1] = await hre.ethers.getSigners();
      const AMASFactory = await hre.ethers.getContractFactory("AMAS");
      const amas = await AMASFactory.deploy();

      await amas.transfer(user1.address, 0n);
      expect(await amas.balanceOf(user1.address)).to.equal(0);
    });

    it("Should handle zero approvals", async function () {
      const [owner, spender] = await hre.ethers.getSigners();
      const AMASFactory = await hre.ethers.getContractFactory("AMAS");
      const amas = await AMASFactory.deploy();

      await amas.approve(spender.address, 0n);
      expect(await amas.allowance(owner.address, spender.address)).to.equal(0);
    });

    it("Should handle transferring all tokens", async function () {
      const [owner, user1] = await hre.ethers.getSigners();
      const AMASFactory = await hre.ethers.getContractFactory("AMAS");
      const amas = await AMASFactory.deploy();

      await amas.transfer(user1.address, TOTAL_SUPPLY);

      expect(await amas.balanceOf(owner.address)).to.equal(0);
      expect(await amas.balanceOf(user1.address)).to.equal(TOTAL_SUPPLY);
    });

    it("Should handle multiple transfers", async function () {
      const [owner, user1, user2] = await hre.ethers.getSigners();
      const AMASFactory = await hre.ethers.getContractFactory("AMAS");
      const amas = await AMASFactory.deploy();

      await amas.transfer(user1.address, 1000n);
      await amas.connect(user1).transfer(user2.address, 300n);

      expect(await amas.balanceOf(user1.address)).to.equal(700n);
      expect(await amas.balanceOf(user2.address)).to.equal(300n);
      expect(await amas.balanceOf(owner.address)).to.equal(TOTAL_SUPPLY - 1000n);
    });
  });
});