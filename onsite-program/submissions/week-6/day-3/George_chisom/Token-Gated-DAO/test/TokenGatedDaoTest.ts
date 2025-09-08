import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import { ethers } from "hardhat";

describe("TokenGatedDao", function () {
  async function deployTokenGatedDaoFixture() {
    const [owner, member1, member2] = await hre.ethers.getSigners();

    const ERC7432RoleRegistry = await hre.ethers.getContractFactory(
      "ERC7432RoleRegistry"
    );
    const roleRegistry = await ERC7432RoleRegistry.deploy();
    await roleRegistry.waitForDeployment();

    const NFT = await hre.ethers.getContractFactory("Nft");
    const nft = await NFT.deploy(owner.address);
    await nft.waitForDeployment();

    const TokenGatedDao = await hre.ethers.getContractFactory("TokenGatedDao");
    const tokenGatedDao = await TokenGatedDao.deploy(
      await roleRegistry.getAddress()
    );
    await tokenGatedDao.waitForDeployment();

    const voterRole = hre.ethers.keccak256(
      hre.ethers.toUtf8Bytes("VOTER_ROLE")
    );
    const proposerRole = hre.ethers.keccak256(
      hre.ethers.toUtf8Bytes("PROPOSER_ROLE")
    );

    const tx = await nft.mint(owner.address, "ipfs://QmTestUri");
    const receipt = await tx.wait();
    const transferEvent = receipt.logs?.find((log: any) => {
      try {
        const parsed = nft.interface.parseLog(log);
        return parsed?.name === "Transfer";
      } catch {
        return false;
      }
    });

    const tokenId = transferEvent
      ? nft.interface.parseLog(transferEvent).args.tokenId
      : null;

    return {
      tokenGatedDao,
      owner,
      member1,
      member2,
      nft,
      roleRegistry,
      voterRole,
      proposerRole,
      tokenId,
    };
  }

  describe("Deployment", function () {
    it("Should deploy the contract", async function () {
      const { tokenGatedDao, nft, roleRegistry } = await loadFixture(
        deployTokenGatedDaoFixture
      );

      expect(await tokenGatedDao.getAddress()).to.not.equal(ethers.ZeroAddress);
      expect(await nft.getAddress()).to.not.equal(ethers.ZeroAddress);
      expect(await roleRegistry.getAddress()).to.not.equal(ethers.ZeroAddress);
    });
  });

  describe("NFT Functions", function () {
    it("Should mint NFT correctly", async function () {
      const { nft, owner } = await loadFixture(deployTokenGatedDaoFixture);

      // Check NFT details
      expect(await nft.name()).to.equal("GEORGEDAO");
      expect(await nft.symbol()).to.equal("GEODO");
      expect(await nft.ownerOf(0)).to.equal(owner.address);
    });

    it("Should allow users to safeMint", async function () {
      const { nft, member1 } = await loadFixture(deployTokenGatedDaoFixture);

      const tx = await nft.connect(member1).safeMint("ipfs://QmTestUri2");
      const receipt = await tx.wait();

      const transferEvent = receipt.logs?.find((log: any) => {
        try {
          const parsed = nft.interface.parseLog(log);
          return parsed?.name === "Transfer";
        } catch {
          return false;
        }
      });

      const tokenId = transferEvent
        ? nft.interface.parseLog(transferEvent).args.tokenId
        : null;
      expect(await nft.ownerOf(tokenId)).to.equal(member1.address);
    });
  });

  describe("Create Proposal", function () {
    it("Should allow proposer to create a proposal", async function () {
      const {
        tokenGatedDao,
        nft,
        roleRegistry,
        proposerRole,
        tokenId,
        owner,
        member1,
      } = await loadFixture(deployTokenGatedDaoFixture);

      // First, give approval to member1 to grant roles on behalf of owner
      await roleRegistry
        .connect(owner)
        .setRoleApprovalForAll(await nft.getAddress(), member1.address, true);

      // Grant Proposer role using member1 account (workaround for inverted logic)
      const role = {
        roleId: proposerRole,
        tokenAddress: await nft.getAddress(),
        tokenId: tokenId,
        recipient: owner.address,
        expirationDate: 0, // Never expires
        revocable: true,
        data: "0x",
      };

      await roleRegistry.connect(member1).grantRole(role);

      // Create proposal
      await tokenGatedDao.createProposal(
        await nft.getAddress(),
        tokenId,
        "Test proposal"
      );

      const proposal = await tokenGatedDao.proposals(1);
      expect(proposal.description).to.equal("Test proposal");
      expect(proposal.proposer).to.equal(owner.address);
    });
  });
});
