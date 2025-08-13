import { expect } from "chai";
import { ethers } from "hardhat";

describe("RoleNFT", function () {
  let roleNFT: any;
  let owner: any;
  let addr1: any;

  beforeEach(async () => {
    [owner, addr1] = await ethers.getSigners();
    const RoleNFT = await ethers.getContractFactory("RoleNFT");
    roleNFT = await RoleNFT.deploy();
    
  });

  it("mints an NFT with a token URI", async () => {
    await roleNFT.mint(owner.address, 1, "ipfs://test-uri");
    expect(await roleNFT.ownerOf(1)).to.equal(owner.address);
  });

  it("allows the owner to assign a role", async () => {
    await roleNFT.mint(owner.address, 2, "ipfs://test-uri");
    await roleNFT.assignRole(2, "VOTER");
    expect(await roleNFT.hasRole(2, "VOTER")).to.equal(true);
  });

  it("reverts if a non-owner tries to assign a role", async () => {
    await roleNFT.mint(owner.address, 3, "ipfs://test-uri");
    await expect(roleNFT.connect(addr1).assignRole(3, "VOTER")).to.be.revertedWith("Not token owner");
  });

  it("returns false if a role has not been assigned", async () => {
    await roleNFT.mint(owner.address, 4, "ipfs://test-uri");
    expect(await roleNFT.hasRole(4, "ADMIN")).to.equal(false);
  });
});
