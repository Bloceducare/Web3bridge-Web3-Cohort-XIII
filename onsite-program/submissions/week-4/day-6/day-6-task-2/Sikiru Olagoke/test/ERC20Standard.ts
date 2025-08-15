import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre from "hardhat";

describe("ERC20Standard", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployERC20Standard() {
    const totalSupply_ = 10000000000000000000000n;

    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount1, otherAccount2] = await hre.ethers.getSigners();

    const ERC20Standard = await hre.ethers.getContractFactory("ERC20Standard");
    const erc20Standard = await ERC20Standard.deploy();

    return { erc20Standard, owner, otherAccount1, otherAccount2, totalSupply_ };
  }

  describe("Deployment", function () {
    it("Should set the right totalSupply", async function () {
      const { erc20Standard, totalSupply_ } =
        await loadFixture(deployERC20Standard);

      expect(await erc20Standard.totalSupply()).to.equal(totalSupply_);
    });

    it("Should get the token name", async function () {
      const { erc20Standard } = await loadFixture(deployERC20Standard);

      expect(await erc20Standard.token_name()).to.equal("Token_Name");
    });

    it("Should get the token decimal", async () => {
      const { erc20Standard } = await loadFixture(deployERC20Standard);

      expect(await erc20Standard.get_decimals()).to.equal(18);
    });
  });

  describe("Transfer Check", function () {
    describe("Validations", function () {
      it("Should revert if balance is low", async function () {
        const { erc20Standard, owner } = await loadFixture(deployERC20Standard);

        expect(await erc20Standard.balanceOf(owner)).to.be.gt(30000);
      });
    });

    describe("Transfer", function () {
      it("Should transfer token to another account", async function () {
        const { erc20Standard, otherAccount1 } =
          await loadFixture(deployERC20Standard);
        const _amount = 600000n;

        const status = await erc20Standard.transfer.staticCall(
          otherAccount1,
          _amount,
        );

        expect(status).to.be.true;
      });

      it("Should return false if balance is low", async function () {
        const { erc20Standard, otherAccount1 } =
          await loadFixture(deployERC20Standard);
        const _amount = 600000000000000000000000000n;

        await expect(
          erc20Standard.transfer(otherAccount1, _amount),
        ).to.be.revertedWith("You're low on token balance");
      });
    });
  });

  describe("Allowance", function () {
    it("Should set amount an address can spend", async () => {
      const { erc20Standard, owner, otherAccount1 } =
        await loadFixture(deployERC20Standard);

      const allowed_amount = 10000000;

      await erc20Standard.approve(otherAccount1, allowed_amount);

      expect(await erc20Standard.allowance(owner, otherAccount1)).to.equal(
        allowed_amount,
      );
    });
  });

  describe("Approve", function () {
    it("Should check if an account has been approved", async () => {
      const { erc20Standard, otherAccount1 } =
        await loadFixture(deployERC20Standard);

      const allowed_amount = 10000000;

      expect(
        await erc20Standard.approve.staticCall(otherAccount1, allowed_amount),
      ).to.be.true;
    });
  });

  describe("TransferFrom", function () {
    it("Should set amount an address can spend", async () => {
      const { erc20Standard, owner, otherAccount1 } =
        await loadFixture(deployERC20Standard);

      const allowed_amount = 10000000;

      await erc20Standard.approve(otherAccount1, allowed_amount);

      expect(await erc20Standard.allowance(owner, otherAccount1)).to.equal(
        allowed_amount,
      );
    });

    it("Should check if an account has been approved", async () => {
      const { erc20Standard, otherAccount1 } =
        await loadFixture(deployERC20Standard);

      const allowed_amount = 10000000;

      expect(
        await erc20Standard.approve.staticCall(otherAccount1, allowed_amount),
      ).to.be.true;
    });

    it("Should check an account can transfer on behalf of the owner", async () => {
      const { erc20Standard, owner, otherAccount1, otherAccount2 } =
        await loadFixture(deployERC20Standard);

      const owner_balance = await erc20Standard.balanceOf(owner.address);
      const recipient_balance = await erc20Standard.balanceOf(
        otherAccount2.address,
      );

      const _amount = 10000000n;
      const allowed_amount = 10000000000n;

      await erc20Standard.approve(otherAccount1.address, allowed_amount);
      await erc20Standard.allowance(owner.address, otherAccount1.address);

      await erc20Standard
        .connect(otherAccount1)
        .trasferFrom(owner.address, otherAccount2.address, _amount);

      const new_owner_balance = await erc20Standard.balanceOf(owner.address);
      const new_recipient_balance = await erc20Standard.balanceOf(
        otherAccount2.address,
      );

      expect(new_owner_balance).to.equal(owner_balance - _amount);
      expect(new_recipient_balance).to.equal(recipient_balance + _amount);
    });

    it("Should failed if an account approval is greater than transfer amount", async () => {
      const { erc20Standard, owner, otherAccount1, otherAccount2 } =
        await loadFixture(deployERC20Standard);

      const owner_balance = await erc20Standard.balanceOf(owner.address);
      const recipient_balance = await erc20Standard.balanceOf(
        otherAccount2.address,
      );

      const _amount = 10000000n;
      const allowed_amount = 100000n;

      await erc20Standard.approve(otherAccount1.address, allowed_amount);
      await erc20Standard.allowance(owner.address, otherAccount1.address);

      await expect(
        erc20Standard
          .connect(otherAccount1)
          .trasferFrom.staticCall(
            owner.address,
            otherAccount2.address,
            _amount,
          ),
      ).to.be.reverted;

      //  const new_owner_balance = await erc20Standard.balanceOf(owner.address);
      //   const new_recipient_balance = await erc20Standard.balanceOf(
      //     otherAccount2.address,
      //   );

      //  expect(new_owner_balance).to.equal(owner_balance - _amount);
      //  expect(new_recipient_balance).to.equal(recipient_balance + _amount);
    });
  });
});
