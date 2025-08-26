import { ethers } from "hardhat";
import { expect } from "chai";
import { Contract, Signer } from "ethers";

describe("ERC20", function () {
  let token: any;
  let owner: Signer;
  let addr1: Signer;
  let addr2: Signer;

  const NAME = "TestToken";
  const SYMBOL = "TTK";
  const DECIMALS = 18;
  const ONE_TOKEN = ethers.parseUnits("1", DECIMALS);
  const HUNDRED = ethers.parseUnits("100", DECIMALS);

  beforeEach(async () => {
    [owner, addr1, addr2] = await ethers.getSigners();
    const ERC20 = await ethers.getContractFactory("ERC20");
    token = await ERC20.deploy(NAME, SYMBOL, DECIMALS);
    await token.mint(await owner.getAddress(), HUNDRED);
  });

  describe("Deployment", () => {
    it("Should set name, symbol, and decimals", async () => {
      expect(await token.name()).to.equal(NAME);
      expect(await token.symbol()).to.equal(SYMBOL);
      expect(await token.decimals()).to.equal(DECIMALS);
    });

    it("Should mint initial supply to owner", async () => {
      const balance = await token.balanceOf(await owner.getAddress());
      expect(balance).to.equal(HUNDRED);
    });

    it("Should update totalSupply after mint", async () => {
      const newAmount = ethers.parseUnits("50", DECIMALS);
      await token.mint(await addr1.getAddress(), newAmount);
      expect(await token.totalSupply()).to.equal(HUNDRED + newAmount);
      expect(await token.balanceOf(await addr1.getAddress())).to.equal(newAmount);
    });
  });

  describe("Transfers", () => {
    it("Should transfer tokens between accounts", async () => {
      await token.transfer(await addr1.getAddress(), ONE_TOKEN);
      expect(await token.balanceOf(await addr1.getAddress())).to.equal(ONE_TOKEN);
      expect(await token.balanceOf(await owner.getAddress())).to.equal(HUNDRED - ONE_TOKEN);
    });

    it("Should emit Transfer event", async () => {
      await expect(token.transfer(await addr1.getAddress(), ONE_TOKEN))
        .to.emit(token, "Transfer")
        .withArgs(await owner.getAddress(), await addr1.getAddress(), ONE_TOKEN);
    });

    it("Should fail if sender has insufficient balance", async () => {
      await expect(token.connect(addr1).transfer(await addr2.getAddress(), ONE_TOKEN))
        .to.be.reverted;
    });
  });

  describe("Approve & Allowance", () => {
    it("Should approve spender", async () => {
      await expect(token.approve(await addr1.getAddress(), ONE_TOKEN))
        .to.emit(token, "Approval")
        .withArgs(await owner.getAddress(), await addr1.getAddress(), ONE_TOKEN);

      const allowance = await token.allowance(await owner.getAddress(), await addr1.getAddress());
      expect(allowance).to.equal(ONE_TOKEN);
    });

    it("Should allow transferFrom if approved", async () => {
      await token.approve(await addr1.getAddress(), ONE_TOKEN);
      await token.connect(addr1).transferFrom(
        await owner.getAddress(),
        await addr2.getAddress(),
        ONE_TOKEN
      );

      expect(await token.balanceOf(await addr2.getAddress())).to.equal(ONE_TOKEN);
      expect(await token.balanceOf(await owner.getAddress())).to.equal(HUNDRED - ONE_TOKEN);

      const remainingAllowance = await token.allowance(
        await owner.getAddress(),
        await addr1.getAddress()
      );
      expect(remainingAllowance).to.equal(0);
    });

    it("Should fail transferFrom without enough allowance", async () => {
      await expect(
        token.connect(addr1).transferFrom(
          await owner.getAddress(),
          await addr2.getAddress(),
          ONE_TOKEN
        )
      ).to.be.reverted;
    });
  });

  describe("Burn", () => {
    it("Should burn tokens from specified account", async () => {
      await token.burn(await owner.getAddress(), ONE_TOKEN);
      expect(await token.balanceOf(await owner.getAddress())).to.equal(HUNDRED - ONE_TOKEN);
      expect(await token.totalSupply()).to.equal(HUNDRED - ONE_TOKEN);
    });

    it("Should emit Transfer event to address(0) on burn", async () => {
      await expect(token.burn(await owner.getAddress(), ONE_TOKEN))
        .to.emit(token, "Transfer")
        .withArgs(await owner.getAddress(), ethers.ZeroAddress, ONE_TOKEN);
    });

    it("Should fail if burn amount exceeds balance", async () => {
      await expect(
        token.burn(await addr1.getAddress(), ONE_TOKEN)
      ).to.be.reverted;
    });
  });
});
