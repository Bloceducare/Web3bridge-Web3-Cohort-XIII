const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");

describe("school", function () {
  async function deploySchool() {
    const [owner, otherAccount] = await ethers.getSigners();

    const scholl = await ethers.getContractFactory("SchoolManagementSystem");
    const school = await scholl.deploy();

    return { school, owner, otherAccount };
  }

  describe("deployment", function () {
    it("should deploy properly", async function () {
      const { school, owner, otherAccount } = await loadFixture(deploySchool);

      expect(await school.getAddress()).to.be.properAddress;
    });
  });
  describe("registration", function () {
    it("should deploy properly", async function () {
      const { school, owner, otherAccount } = await loadFixture(deploySchool);

      expect(await school.getAddress()).to.be.properAddress;
    });
  });


});
