import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("Token", function () {
  // ✅ Shared fixture: deploy once, reuse in all tests
  async function deployTokenFixture() {
    //const [owner, user] = await hre.ethers.getSigners();

    const Token = await hre.ethers.getContractFactory("Token");
    const token = await Token.deploy();
    //await token.waitForDeployment();

    return { token };
  }

  describe("Deployment", function () {
    it("Should set the correct owner", async function () {
      const name = "Test Token";
      const symbol = "TTK";
      const initialSupply = 10000;
      const { token } = await loadFixture(deployTokenFixture);
      await token.createToken(name, symbol, initialSupply);
    });

    describe("Update Token", function () {
      it("Should update token name", async function () {
        const address = "0x1234567890123456789012345678901234567890";
        const newName = "TTK";

        const { token } = await loadFixture(deployTokenFixture);
        await token.updateTokenName(address, newName);

        const tokenData = await token.tokens(address);
        expect(tokenData.name).to.equal(newName);
      });
    });

    describe("change owner", function () {
      it("Should change owner", async function () {
        const address = "0x1234567890123456789012345678901234567890";

        const { token } = await loadFixture(deployTokenFixture);
        await token.transferOwnerShip(address);

        const tokenData = await token.tokens(address);
      });
    });

    describe("Get Token Details", function () {
      it("Should get token details", async function () {
        const address = "0x1234567890123456789012345678901234567890";

        const { token } = await loadFixture(deployTokenFixture);
        await token.getTokenDetails(address);
        const tokenData = await token.tokens(address);
       
      });
    });

    describe("Delete Token", function () {
      it("Should delete token", async function () {
        const address = "0x1234567890123456789012345678901234567890";

        const { token } = await loadFixture(deployTokenFixture);
        await token.deleteToken();
        const tokenData = await token.tokens(address);
       
      });
    });

  });
});
