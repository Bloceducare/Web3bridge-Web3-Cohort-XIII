import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("GatedDAO", function () {
  it("should register member, mint NFT, and allow proposal creation", async function () {
    const [owner, user] = await hre.ethers.getSigners();

    // Deploy NFT Collection
    const NftCollection = await hre.ethers.getContractFactory("NftCollection");
    const nft = await NftCollection.deploy("DAO Membership", "DAOM");
    await nft.waitForDeployment();

    // Deploy RolesRegistry
    const RolesRegistry = await hre.ethers.getContractFactory("RolesRegistry7432");
    const registry = await RolesRegistry.deploy([owner.address]);
    await registry.waitForDeployment();

    // Deploy DAO
    const GatedDAO = await hre.ethers.getContractFactory("GatedDAO");
    const dao = await GatedDAO.deploy(nft.getAddress(), registry.getAddress());
    await dao.waitForDeployment();

    // Set DAO as NFT minter
    await nft.setMinter(dao.getAddress());

    // Register member
      await dao.registerMember(user.getAddress());

    expect(await nft.ownerOf(1)).to.equal(user.getAddress());

    // Assign proposer role
    const roleId = hre.ethers.utils.formatBytes32String("PROPOSER");
    await registry.grantRole({
      roleId,
      tokenAddress: nft.getAddress(),
      tokenId: 1,
      recipient: user.address,
      expirationDate: Math.floor(Date.now() / 1000) + 3600,
      revocable: true,
      data: "0x"
    });

    // User creates proposal
    await dao.connect(user).createProposal(
      nft.getAddress(),
      1,
      roleId,
      "Fund new project"
    );

    const proposal = await dao.proposals(1);
    expect(proposal.description).to.equal("Fund new project");
  });
});

