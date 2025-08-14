const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("RoleGatedDAO", function () {
  it("should allow proposing with active role", async function () {
    const [owner] = await ethers.getSigners();
    const MembershipNFT = await ethers.getContractFactory("MembershipNFT");
    const nft = await MembershipNFT.deploy();
    await nft.waitForDeployment();

    const RolesRegistry = await ethers.getContractFactory("RolesRegistry");
    const registry = await RolesRegistry.deploy();
    await registry.waitForDeployment();

    const RoleGatedGovernor = await ethers.getContractFactory("RoleGatedGovernor");
    const governor = await RoleGatedGovernor.deploy(await nft.getAddress(), await registry.getAddress());
    await governor.waitForDeployment();

    await nft.connect(owner).mint(owner.address); // tokenId 0
    const VOTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("VOTER"));
    const role = {
      roleId: VOTER_ROLE,
      tokenAddress: await nft.getAddress(),
      tokenId: 0,
      recipient: owner.address,
      expirationDate: Math.floor(Date.now() / 1000) + 60, // 1 minute
      revocable: true,
      data: "0x"
    };
    await registry.connect(owner).grantRole(role);

    await expect(governor.connect(owner).propose(
      [], // address[]
      [], // uint256[]
      [], // bytes[]
      "Test Proposal",
      0
    )).not.to.be.reverted;
  });

  it("should prevent proposing without active role", async function () {
    const [owner, nonMember] = await ethers.getSigners();
    const MembershipNFT = await ethers.getContractFactory("MembershipNFT");
    const nft = await MembershipNFT.deploy();
    await nft.waitForDeployment();

    const RolesRegistry = await ethers.getContractFactory("RolesRegistry");
    const registry = await RolesRegistry.deploy();
    await registry.waitForDeployment();

    const RoleGatedGovernor = await ethers.getContractFactory("RoleGatedGovernor");
    const governor = await RoleGatedGovernor.deploy(await nft.getAddress(), await registry.getAddress());
    await governor.waitForDeployment();

    await expect(governor.connect(nonMember).propose(
      [], // address[]
      [], // uint256[]
      [], // bytes[]
      "Invalid Proposal",
      0
    )).to.be.revertedWith("Role not assigned");
  });
});