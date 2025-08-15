import { expect } from "chai";
import { ethers } from "hardhat";

describe("ClockSVG", () => {
  it("tokenURI reflects the current block timestamp", async () => {
    const [owner, user] = await ethers.getSigners();
    const Clock = await ethers.getContractFactory("ClockSVG");
    const clock = await Clock.deploy();
    await clock.waitForDeployment();

    const tx = await clock.mint(user.address);
    await tx.wait();
    const id = 1;

    const uri1 = await clock.tokenURI(id);
    expect(uri1).to.be.a("string");

    await ethers.provider.send("evm_increaseTime", [90]);
    await ethers.provider.send("evm_mine", []);

    const uri2 = await clock.tokenURI(id);
    expect(uri2).to.be.a("string");
    expect(uri2).to.not.equal(uri1); 
  });
});
