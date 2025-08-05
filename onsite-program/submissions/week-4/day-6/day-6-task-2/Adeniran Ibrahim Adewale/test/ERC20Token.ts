import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("Token Deployment", function () {
  async function deployToken() {

    const Token = await hre.ethers.getContractFactory("ERC20Token");
    const token = await Token.deploy();

    const addressFrom = "0x6Cac76f9e8d6F55b3823D8aEADEad970a5441b67";

    const address = "0x155611AC1EEDD111d645f0De9637e5f6FfF815F9";

    const value = 20;



    return {token, address, addressFrom, value};
  }

  describe("Initiate Transaction", function () {
    it("Should transfer tokens", async function () {

      const {token, address, value} = await loadFixture(deployToken);

      await token.transfer(address,value);

      const balance = await token.balanceOf(address);

      expect(balance).to.equal(value);
    });

    it("Should approve token transfer", async function () {

      const {token, address, value} = await loadFixture(deployToken);

      await token.approve(address,value);
    });

    it("Should allow user to transfer tokens", async function () {

      const {token, address, addressFrom, value} = await loadFixture(deployToken);

      await token.transferFrom(addressFrom,address,value);

      const balanceFrom = await token.balanceOf(address);
      const balanceTo = await token.balanceOf(address);
      // const balance = await token.balanceOf(address);

      expect(balanceFrom).to.equal(value);
      expect(balanceTo).to.equal(value);
    });

    it("Should display contract balance", async function () {

      const {token, address, value} = await loadFixture(deployToken);

      await token.contractBalance();
    });

    it("Should display user balance", async function () {

      const {token, address, value} = await loadFixture(deployToken);

      await token.getbalance();
    });

    it("Should display token details", async function () {

      const {token, address, value} = await loadFixture(deployToken);

      await token.getTokenDetails();
    });
  });
 });