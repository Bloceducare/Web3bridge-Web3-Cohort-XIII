import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("ERC20Token", function () {
  async function deployERC20Token() {
    const _firstSupply = 1;

    const [admin, otherAccount] = await hre.ethers.getSigners();

    const ERC20Token = await hre.ethers.getContractFactory("ERC20Token");

    const erc = await ERC20Token.deploy(admin.address, _firstSupply);

    return { erc, _firstSupply, admin, otherAccount };
  }

  describe("Get Token Name", function () {
    it("name of token", async function () {
      const { erc } = await loadFixture(deployERC20Token);

      const token_get_name = await erc.tokenDetails.name;

      expect(token_get_name).to.equal(token_get_name);
    });
  });

  describe("total supply", function () {
    it("This is to know total amount in circulation", async function () {
      const { erc } = await loadFixture(deployERC20Token);

      expect(await erc.total_supply()).to.equal(1000000000000000000n);

      // expect(await erc.total_supply()).to.equal(ethers.utils.parseUnits("1", 18));
    });

    describe("balance of an account", function () {
      it("This is to know the balance of an account", async function () {
        const { erc, otherAccount } = await loadFixture(deployERC20Token);

        const view_balance = await erc.balanceOf(otherAccount.address);

        expect(view_balance).to.equal(view_balance);
      });
    });

    describe("Transfer funds", function () {
      it("this is to transfer funds", async function () {
        const { erc, admin, otherAccount } = await loadFixture(
          deployERC20Token
        );

        const _amount = 1;

        const transfer = await erc
          .connect(admin)
          .transfer(otherAccount.address, _amount);

        const balance = await erc.balanceOf(otherAccount.address);

        await transfer.wait();

        expect(balance).to.equal(_amount);
      });
    });

    describe("Give allowance", function () {
      it("To allow an acct spend token", async function () {
        const { erc, admin, otherAccount } = await loadFixture(
          deployERC20Token
        );

        const allow = await erc.allowance(admin.address, otherAccount.address);

        expect(allow).to.equal(0);
      });
    });

    describe("Approve Token", function () {
      it("this give an account amount to spend", async function () {
        const { erc, admin, otherAccount } = await loadFixture(
          deployERC20Token
        );

        const amount = 2000;

        const approval = await erc
          .connect(admin)
          .approve(otherAccount.address, amount);

        const amount_allowance = await erc.allowance(
          admin.address,
          otherAccount.address
        );

        await approval.wait();

        expect(amount_allowance).to.equal(amount);
      });
    });

    describe("Mint Tokens", function () {
      it("should mint tokens to the specified address", async function () {
        const { erc, admin } = await loadFixture(deployERC20Token);
        const mintAmount = 1000;

        const mintToken = await erc
          .connect(admin)
          .mint_token(admin.address, mintAmount);
        await mintToken.wait();

        const balance = await erc.balanceOf(admin.address);

        expect(balance).to.equal(1000000000000001000n);
      });
    });

    describe("Burn Tokens", function () {
      it("should burn tokens", async function () {
        const { erc, admin } = await loadFixture(deployERC20Token);

        const burnAmount = 10;

        const acctBalance = await erc.balanceOf(admin.address);

        const total_coin = await erc.total_supply();

        const mintToken = await erc.connect(admin).burn_token(burnAmount);

        await mintToken.wait();

        expect(acctBalance - BigInt(burnAmount)).to.equal(
          acctBalance - BigInt(burnAmount)
        );

        const totalBurnt = total_coin - BigInt(burnAmount);

        const new_supply = await erc.total_supply();

        expect(new_supply).to.equal(totalBurnt);
      });
    });

    describe("view Admin", function () {
      it("should return admin address", async function () {
        const { erc, admin } = await loadFixture(deployERC20Token);

        const adminAddress = await erc.view_admin();

        expect(admin.address).to.equals(adminAddress);
      });
    });

    describe("transferFrom", function () {
      it("should transfer tokens on behalf of owner", async function () {
        const { erc, admin, otherAccount } = await loadFixture(
          deployERC20Token
        );

        const transfer_amount = 100;
        const allow_amount = 100000;

        await erc.connect(admin).mint_token(admin.address, 100000);

        const init_owner_balance = await erc.balanceOf(admin.address);

        const init_spender_balance = await erc.balanceOf(otherAccount.address);

        await erc.connect(admin).approve(otherAccount.address, allow_amount);

        const allowance = await erc.allowance(
          admin.address,
          otherAccount.address
        );
        expect(allowance).to.equal(allow_amount);

        await erc
          .connect(otherAccount)
          .transferFrom(admin.address, otherAccount.address, transfer_amount);

        const new_owner_balance = await erc.balanceOf(admin.address);

        const new_spender_balance = await erc.balanceOf(otherAccount.address);

        expect(new_owner_balance).to.equal(
          init_owner_balance - BigInt(transfer_amount)
        );
        expect(new_spender_balance).to.equal(
          init_spender_balance + BigInt(transfer_amount)
        );
      });
    });
  });
});
