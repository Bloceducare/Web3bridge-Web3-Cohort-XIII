import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("AMAS", function () {
  async function AmasFixture() {
    let symbol = "AMS";
    let name = "Amas Coin";
    let decimals = 18;
    let totalSupply = hre.ethers.parseEther("1000"); // 1 million tokens

    const [owner, addr1, addr2] = await hre.ethers.getSigners();

    const AMAS = await hre.ethers.getContractFactory("AMAS");
    const amas = await AMAS.deploy();

    return { amas, owner, addr1, addr2, symbol, name, decimals, totalSupply };
  }

  describe("Deployment", function () {
    it("It should deploy the contract", async function () {
      const { amas, owner, addr1, addr2, symbol, name, decimals, totalSupply } =
        await loadFixture(AmasFixture);

      const address = await amas.getAddress();
      expect(address).to.not.be.undefined;
      expect(address).to.not.be.null;
    });
  });

  describe("Token Properties", function () {
    it("Should have the correct symbol", async function () {
      const { amas, symbol } = await loadFixture(AmasFixture);
      expect(await amas.symbol()).to.equal(symbol);
    });

    describe("BalanceOf", function () {
      it("Should  ensure that the balance is equal ", async function () {
        const { amas, owner, addr1 } = await loadFixture(AmasFixture);
        expect(await amas.balanceOf(owner.address)).to.equal(
          hre.ethers.parseEther("1000")
        );
      });
      describe("Name of Token", function () {
        it("Should have the correct name", async function () {
          const { amas, name } = await loadFixture(AmasFixture);
          expect(await amas.name()).to.equal(name);
        });
        describe("Transfer", function () {
          it("Should transfer tokens between accounts", async function () {
            const { amas, owner, addr1 } = await loadFixture(AmasFixture);
            const transferAmount:bigint = hre.ethers.parseEther("100");
            const initialBalance = await amas.balanceOf(owner)
            await amas.transfer(addr1, transferAmount);
            expect(await amas.balanceOf(addr1)).to.equal(transferAmount);
            expect(await amas.balanceOf(owner)).to.equal(initialBalance - transferAmount)
          });
        it("should grant allowance funds", async function () {
          const { amas,owner, addr1, addr2} = await loadFixture(AmasFixture);
          const allowanceAmount: bigint = hre.ethers.parseEther("50");
          expect(await amas.allowance(owner, addr1)).to.equal(0n);
          expect(await amas.allowance(owner, addr2)).to.equal(0n);
          await amas.approve(addr1,allowanceAmount);
          expect(await amas.allowance()).to.equal(allowanceAmount);
         });

        // it("Should have the correct total supply", async function () {
        //   const { amas, totalSupply } = await loadFixture(AmasFixture);
        //   expect(await amas._totalSupply()).to.equal(totalSupply);
        // });
      });
    });
  });
});
  });