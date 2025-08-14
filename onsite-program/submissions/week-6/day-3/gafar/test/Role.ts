import { expect } from "chai";
import hre from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("RoleBasedNFT + RoleGatedDAO", function () {

  async function deployRoleNFT() {
    const [owner, alice, bob, charlie] = await hre.ethers.getSigners();

    const NFT = await hre.ethers.getContractFactory("RoleBasedNFT");
    const nft = await NFT.deploy("RoleNFT", "RNFT");

    return { nft, owner, alice, bob, charlie };
  }

  it("should deploy RoleBasedNFT", async function () {
    const { nft } = await loadFixture(deployRoleNFT);
    expect(await nft.name()).to.equal("RoleNFT");
    expect(await nft.symbol()).to.equal("RNFT");
  });

  it("should deploy RoleGatedDAO with NFT address", async function () {
    const { nft } = await loadFixture(deployRoleNFT);
    const DAO = await hre.ethers.getContractFactory("RoleGatedDAO");
    const dao = await DAO.deploy(nft.target); // nft.target = address
    expect(await dao.nft()).to.equal(nft.target);
  });

  it("should mint NFTs to users", async function () {
    const { nft, alice, bob, charlie } = await loadFixture(deployRoleNFT);
    await nft.mint(alice.address);
    await nft.mint(bob.address);
    await nft.mint(charlie.address);

    expect(await nft.ownerOf(1)).to.equal(alice.address);
    expect(await nft.ownerOf(2)).to.equal(bob.address);
    expect(await nft.ownerOf(3)).to.equal(charlie.address);
  });

  it("should grant roles and allow proposal creation", async function () {
    const { nft, alice, bob } = await loadFixture(deployRoleNFT);

    const DAO = await hre.ethers.getContractFactory("RoleGatedDAO");
    const dao = await DAO.deploy(nft.target);

    // Mint NFT for Alice
    await nft.mint(alice.address);

    const ROLE_PROPOSER = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("DAO_PROPOSER()"));

    // Grant PROPOSER role to Alice
    await nft.connect(alice).grantRole({
      roleId: ROLE_PROPOSER,
      tokenAddress: nft.target,
      tokenId: 1,
      recipient: alice.address,
      expirationDate: hre.ethers.MaxUint64,
      revocable: true,
      data: "0x"
    });

    // Alice proposes
    const tx = await dao.connect(alice).propose(1, "Proposal 1", 60);
    const receipt = await tx.wait();
    const event = receipt.logs.map(log => {
      try {
        return dao.interface.parseLog(log);
      } catch {
        return null;
      }
    }).find(e => e && e.name === "Proposed");

    expect(event.args.proposer).to.equal(alice.address);

    // Bob should fail to propose
    await expect(
      dao.connect(bob).propose(1, "Bad Proposal", 60)
    ).to.be.revertedWith("Missing PROPOSER role");
  });

  it("should allow only VOTER role to vote", async function () {
    const { nft, alice, bob } = await loadFixture(deployRoleNFT);

    const DAO = await hre.ethers.getContractFactory("RoleGatedDAO");
    const dao = await DAO.deploy(nft.target);

    await nft.mint(alice.address);
    await nft.mint(bob.address);

    const ROLE_PROPOSER = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("DAO_PROPOSER()"));
    const ROLE_VOTER = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("DAO_VOTER()"));

    // Grant proposer to Alice
    await nft.connect(alice).grantRole({
      roleId: ROLE_PROPOSER,
      tokenAddress: nft.target,
      tokenId: 1,
      recipient: alice.address,
      expirationDate: hre.ethers.MaxUint64,
      revocable: true,
      data: "0x"
    });

    // Grant voter to Bob
    await nft.connect(bob).grantRole({
      roleId: ROLE_VOTER,
      tokenAddress: nft.target,
      tokenId: 2,
      recipient: bob.address,
      expirationDate: hre.ethers.MaxUint64,
      revocable: true,
      data: "0x"
    });

    // Alice proposes
    await dao.connect(alice).propose(1, "Proposal 1", 60);

    // Bob votes yes
    await dao.connect(bob).vote(1, 2, true);
    const proposal = await dao.proposals(1);
    expect(proposal.yes).to.equal(1);

    // Alice tries to vote (fails)
    await expect(
      dao.connect(alice).vote(1, 1, true)
    ).to.be.revertedWith("Missing VOTER role");
  });

  it("should allow only MEMBER role to access resource", async function () {
    const { nft, alice, bob } = await loadFixture(deployRoleNFT);

    const DAO = await hre.ethers.getContractFactory("RoleGatedDAO");
    const dao = await DAO.deploy(nft.target);

    // Mint NFTs
    await nft.mint(alice.address); // tokenId 1
    await nft.mint(bob.address);   // tokenId 2

    const ROLE_MEMBER = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("DAO_MEMBER()"));

    // Grant member to Alice
    await nft.connect(alice).grantRole({
      roleId: ROLE_MEMBER,
      tokenAddress: nft.target,
      tokenId: 1,
      recipient: alice.address,
      expirationDate: hre.ethers.MaxUint64,
      revocable: true,
      data: "0x"
    });

    expect(await dao.connect(alice).accessResource(1)).to.equal("Secret DAO resource granted.");

    await expect(
      dao.connect(bob).accessResource(2)
    ).to.be.revertedWith("Missing MEMBER role");
  });

  it("should reject expired roles", async function () {
    const { nft, bob } = await loadFixture(deployRoleNFT);

    const DAO = await hre.ethers.getContractFactory("RoleGatedDAO");
    const dao = await DAO.deploy(nft.target);

    await nft.mint(bob.address); // tokenId 1

    const ROLE_VOTER = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("DAO_VOTER()"));

    // Grant expired voter role to Bob
    const pastTime = Math.floor(Date.now() / 1000) - 1000;
    await nft.connect(bob).grantRole({
      roleId: ROLE_VOTER,
      tokenAddress: nft.target,
      tokenId: 1,
      recipient: bob.address,
      expirationDate: pastTime,
      revocable: true,
      data: "0x"
    });

    const ROLE_PROPOSER = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("DAO_PROPOSER()"));
    await nft.connect(bob).grantRole({
      roleId: ROLE_PROPOSER,
      tokenAddress: nft.target,
      tokenId: 1,
      recipient: bob.address,
      expirationDate: hre.ethers.MaxUint64,
      revocable: true,
      data: "0x"
    });

    await dao.connect(bob).propose(1, "Test Proposal", 60);

    await expect(
      dao.connect(bob).vote(1, 1, true)
    ).to.be.revertedWith("Missing VOTER role");
  });
});
