import { expect } from "chai";
import { ethers } from "hardhat";

describe("MockRolesRegistry + MembershipNFT + TokenGatedDAO", function () {
  it("should run full DAO flow with NFT roles", async function () {
    const [owner, proposer, voter, executor] = await ethers.getSigners();

    const MembershipNFT = await ethers.getContractFactory("MembershipNFT");
    const nft = await MembershipNFT.deploy();
    await nft.waitForDeployment();
    const nftAddress = await nft.getAddress();
    if (!nftAddress) throw new Error("nftAddress is undefined");

    const MockRegistry = await ethers.getContractFactory("MockRolesRegistry");
    const registry = await MockRegistry.deploy();
    await registry.waitForDeployment();
    const registryAddress = await registry.getAddress();
    if (!registryAddress) throw new Error("registryAddress is undefined");

    const TokenGatedDAO = await ethers.getContractFactory("TokenGatedDAO");
    const dao = await TokenGatedDAO.deploy(registryAddress);
    await dao.waitForDeployment();

    const PROPOSER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("DAO_PROPOSER"));
    const VOTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("DAO_VOTER"));
    const EXECUTOR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("DAO_EXECUTOR"));

    await nft.connect(owner).mint(await proposer.getAddress(), "ipfs://proposer.json");
    await nft.connect(owner).mint(await voter.getAddress(), "ipfs://voter.json");
    await nft.connect(owner).mint(await executor.getAddress(), "ipfs://executor.json");

    await registry.setRole(nftAddress, 1, PROPOSER_ROLE, await proposer.getAddress(), ethers.MaxUint64);
    await registry.setRole(nftAddress, 2, VOTER_ROLE, await voter.getAddress(), ethers.MaxUint64);
    await registry.setRole(nftAddress, 3, EXECUTOR_ROLE, await executor.getAddress(), ethers.MaxUint64);

    expect(await registry.hasRole(nftAddress, 1, PROPOSER_ROLE, await proposer.getAddress())).to.be.true;
    expect(await registry.hasRole(nftAddress, 2, VOTER_ROLE, await voter.getAddress())).to.be.true;
    expect(await registry.hasRole(nftAddress, 3, EXECUTOR_ROLE, await executor.getAddress())).to.be.true;

    await expect(dao.connect(proposer).propose(nftAddress, 1, "Proposal #1: Add new feature"))
      .to.emit(dao, "ProposalCreated");

    await expect(dao.connect(voter).vote(nftAddress, 2, 1, true))
      .to.emit(dao, "VoteCast");

    await ethers.provider.send("evm_increaseTime", [3 * 24 * 60 * 60]);
    await ethers.provider.send("evm_mine", []);

    await expect(dao.connect(executor).execute(nftAddress, 3, 1))
      .to.emit(dao, "ProposalExecuted");
  });
});
