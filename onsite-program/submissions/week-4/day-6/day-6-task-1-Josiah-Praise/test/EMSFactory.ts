import { expect } from "chai";
import { ethers } from "hardhat";

describe("EMSFactory", async () => {
  it("should deploy EMS successfully", async () => {
      const emsFactory = await ethers.deployContract("EMSFactory");
      const factoryAddress = await emsFactory.getAddress();

    expect(await emsFactory.getManager()).to.equal(factoryAddress);
  });
});
