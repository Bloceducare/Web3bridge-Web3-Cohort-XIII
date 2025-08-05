import hre from "hardhat";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ERC20Token } from "../typechain-types";

describe("ERC20Token", () => {
  let owner: HardhatEthersSigner;
  let otherAccount: HardhatEthersSigner;
  let otherAccount2: HardhatEthersSigner;
  let erc20Token: ERC20Token;
  let totalSupply: number;
  //setup to deploy contract
  async function deployERC20TokenFixture() {
    const [owner, otherAccount, otherAccount2] = await hre.ethers.getSigners();

    const ERC20Token = await hre.ethers.getContractFactory("ERC20Token");
    const erc20Token = await ERC20Token.deploy();
    const totalSupply = 3000000;

    await erc20Token.mintToken(totalSupply);

    return { owner, otherAccount, otherAccount2, erc20Token, totalSupply };
  }

  beforeEach(async () => {
    const fixture = await loadFixture(deployERC20TokenFixture);
    owner = fixture.owner;
    otherAccount = fixture.otherAccount;
    otherAccount2 = fixture.otherAccount2;
    erc20Token = fixture.erc20Token;
    totalSupply = fixture.totalSupply;
  });

  describe("Deployment", () => {
    it("should have correct token name", async () => {
      expect(await erc20Token.name()).to.be.equal("Zarcc");
    });

    it("should have correct token symbol", async () => {
      expect(await erc20Token.symbol()).to.be.equal("ZRCC");
    });

    it("should have correct owner", async () => {
      expect(await erc20Token.owner()).to.be.equal(owner.address);
    });

    it("total supply should be inital supply", async () => {
      expect(await erc20Token._totalSupply()).to.be.equal(totalSupply);
    });

    it("balance of owner should be equal to total supply", async () => {
      expect(await erc20Token.balanceOf(owner)).to.be.equal(totalSupply);
    });
  });

  describe("Minting tokens", () => {
    it("only owner can mint tokens", async () => {
      expect(
        erc20Token.connect(otherAccount).mintToken(30000)
      ).to.be.revertedWithCustomError(erc20Token, "ONLY_OWNER_CAN_MINT");
    });

    it("update total supply after minting", async () => {
      expect(await erc20Token._totalSupply()).to.equal(totalSupply);
    });

    it("emits transfer event after minting", async () => {
      expect(await erc20Token.mintToken(totalSupply)).to.emit(
        erc20Token,
        "Transfer"
      );
    });
  });

  describe("Transactions", () => {
    it("only all or less than tokens owned", async () => {
      const amountToTransfer = await erc20Token.balanceOf(otherAccount.address);
      expect(
        erc20Token
          .connect(otherAccount)
          .transfer(owner, Number(amountToTransfer) + 100)
      ).to.be.revertedWithCustomError(erc20Token, "INSUFFICIENT_BALANCE");
    });

    it("transfer correct amount to another user", async () => {
      const amountToTransfer = 600;
      expect(
        await erc20Token.transfer(otherAccount.address, amountToTransfer)
      ).to.changeEtherBalances(
        [owner, otherAccount],
        [-amountToTransfer, amountToTransfer]
      );
    });

    it("emits approval event after approving spender", async () => {
      expect(await erc20Token.approve(otherAccount, 100)).to.emit(
        erc20Token,
        "Approval"
      );
    });

    it("save allowances for spenders", async () => {
      const ammountToAllow = 250;
      await erc20Token.approve(otherAccount, ammountToAllow);

      expect(await erc20Token.allowance(otherAccount.address)).to.equal(
        ammountToAllow
      );
    });

    // this test isn't good
    it("spender cant spend more than owner balance", async () => {
      const amountToTransfer = 500;
      await erc20Token.transfer(otherAccount2, amountToTransfer);
      const ammountToAllow = 250;
      await erc20Token
        .connect(otherAccount2)
        .approve(otherAccount, ammountToAllow);

      expect(
        erc20Token
          .connect(otherAccount)
          .transferFrom(otherAccount2, owner.address, ammountToAllow - 1)
      ).to.be.revertedWithCustomError(erc20Token, "INSUFFICIENT_BALANCE");
    });

    // this works
    it("spender can spend owner allowed balance, allowance of spender and balance of owner is updated", async () => {
      const amountToTransfer = 500;
      await erc20Token.transfer(otherAccount2, amountToTransfer);
      const amountToAllow = 250;
      await erc20Token
        .connect(otherAccount2)
        .approve(otherAccount, amountToAllow);

      const amountToTransferFrom = amountToAllow - 50;

      expect(
        await erc20Token
          .connect(otherAccount)
          .transferFrom(otherAccount2, owner.address, amountToTransferFrom)
      ).to.changeEtherBalances(
        [otherAccount2, owner],
        [-amountToTransferFrom, amountToTransferFrom]
      );

      expect(
        await erc20Token.connect(otherAccount2).allowance(otherAccount)
      ).to.equal(amountToAllow - amountToTransferFrom);

      expect(await erc20Token.balanceOf(otherAccount2.address)).to.equal(amountToTransfer - amountToTransferFrom);
    });
  });
});
