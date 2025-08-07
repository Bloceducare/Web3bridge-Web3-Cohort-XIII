import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("ERC20TokenFactory", () => {
  async function deployContract() {
    const [owner, otherAccount] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("ERC20Factory");
    const name = "TestToken";
    const symbol = "TTK";
    const decimals = 18;
    const factory = await Factory.deploy(name, symbol, decimals);
    return { factory, owner, otherAccount, name, symbol, decimals };
  }

  describe("CreateToken & getDeployedTokens", () => {
    it("Should deploy a token with correct parameters", async () => {
      const { factory, name, symbol, decimals } = await loadFixture(deployContract);

      await expect(factory.createToken())
        .to.emit(factory, "TokenCreated")
        .withArgs(anyValue, name, symbol);

      const childAddresses = await factory.getDeployedTokens();
      expect(childAddresses.length).to.equal(1);

      const childContract = await ethers.getContractAt("ERC20Token", childAddresses[0]);

      expect(await childContract.name()).to.equal(name);
      expect(await childContract.symbol()).to.equal(symbol);
      expect(await childContract.decimals()).to.equal(decimals);
    });

    it("Should store each child token address in the array", async () => {
      const { factory } = await loadFixture(deployContract);

      await factory.createToken();
      await factory.createToken();

      const childAddresses = await factory.getDeployedTokens();
      expect(childAddresses.length).to.equal(2);

      // Ensure both are unique addresses
      expect(childAddresses[0]).to.not.equal(childAddresses[1]);
    });
  });
});
