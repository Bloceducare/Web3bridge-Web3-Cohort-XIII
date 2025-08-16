import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import hre from "hardhat";

describe("RoleGatedDAO", function () {
  // Fixture to deploy contracts and set up initial state
  async function deployDAOFixture() {
    const [owner, addr1] = await hre.ethers.getSigners();

    const RoleNFT = await hre.ethers.getContractFactory("RoleNFT");
    const roleNFT = await RoleNFT.deploy();
    await roleNFT.waitForDeployment();

    const Roles = await hre.ethers.getContractFactory("Roles");
    const roles = await Roles.deploy(roleNFT.target);
    await roles.waitForDeployment();

    const RoleGatedDAO = await hre.ethers.getContractFactory("RoleGatedDAO");
    const roleGatedDAO = await RoleGatedDAO.deploy(roleNFT.target, roles.target);
    await roleGatedDAO.waitForDeployment();

    const mintTx = await roleNFT.connect(owner).mint(owner.address);
    const receipt = await mintTx.wait();
    const tokenId = receipt.logs[0].topics[3]; // Extract tokenId from Transfer event

    return { roleNFT, roles, roleGatedDAO, owner, addr1, tokenId };
  }

  describe("Role Management", function () {
    it("Should allow proposing with PROPOSER_ROLE", async function () {
      const { roleGatedDAO, roles, roleNFT, owner, tokenId } = await loadFixture(deployDAOFixture);
      const PROPOSER_ROLE = await roleGatedDAO.PROPOSER_ROLE();
      const expiration = Math.floor(Date.now() / 1000) + 3600;

      await roles.connect(owner).grantRole(PROPOSER_ROLE, roleNFT.target, tokenId, owner.address, expiration, "0x");

      await expect(roleGatedDAO.connect(owner).proposalRole(tokenId, "Test Proposal"))
        .to.not.be.reverted;

      expect(await roleGatedDAO.proposals.length).to.equal(1);
    });

    it("Should allow DAO access with DAO_ROLE", async function () {
      const { roleGatedDAO, roles, roleNFT, owner, tokenId } = await loadFixture(deployDAOFixture);
      const DAO_ROLE = await roleGatedDAO.DAO_ROLE();
      const expiration = Math.floor(Date.now() / 1000) + 3600;

      await roles.connect(owner).grantRole(DAO_ROLE, roleNFT.target, tokenId, owner.address, expiration, "0x");

      await expect(roleGatedDAO.connect(owner).accessDAORole("DAO Access"))
        .to.not.be.reverted;

      expect(await roleGatedDAO.proposals.length).to.equal(1);
    });

    it("Should revert proposing without PROPOSER_ROLE or DAO_ROLE", async function () {
      const { roleGatedDAO, roles, roleNFT, owner, tokenId } = await loadFixture(deployDAOFixture);
      const VOTER_ROLE = await roleGatedDAO.VOTER_ROLE();
      const expiration = Math.floor(Date.now() / 1000) + 3600;

      await roles.connect(owner).grantRole(VOTER_ROLE, roleNFT.target, tokenId, owner.address, expiration, "0x");

      await expect(roleGatedDAO.connect(owner).proposalRole(tokenId, "Test Proposal"))
        .to.be.revertedWith("No proposer or DAO role");
    });

    it("Should allow voting with VOTER_ROLE", async function () {
      const { roleGatedDAO, roles, roleNFT, owner, addr1, tokenId } = await loadFixture(deployDAOFixture);
      const PROPOSER_ROLE = await roleGatedDAO.PROPOSER_ROLE();
      const VOTER_ROLE = await roleGatedDAO.VOTER_ROLE();
      const expiration = Math.floor(Date.now() / 1000) + 3600;

      await roles.connect(owner).grantRole(PROPOSER_ROLE, roleNFT.target, tokenId, owner.address, expiration, "0x");
      await roleGatedDAO.connect(owner).proposalRole(tokenId, "Test Proposal");

      await roles.connect(owner).grantRole(VOTER_ROLE, roleNFT.target, tokenId, addr1.address, expiration, "0x");

      await expect(roleGatedDAO.connect(addr1).voteRole(0, tokenId, true)).to.not.be.reverted;

      const proposal = await roleGatedDAO.proposals(0);
      expect(proposal.yesVotes).to.equal(1);
    });

    it("Should deny voting with DAO_ROLE", async function () {
      const { roleGatedDAO, roles, roleNFT, owner, addr1, tokenId } = await loadFixture(deployDAOFixture);
      const PROPOSER_ROLE = await roleGatedDAO.PROPOSER_ROLE();
      const DAO_ROLE = await roleGatedDAO.DAO_ROLE();
      const expiration = Math.floor(Date.now() / 1000) + 3600;

      await roles.connect(owner).grantRole(PROPOSER_ROLE, roleNFT.target, tokenId, owner.address, expiration, "0x");
      await roleGatedDAO.connect(owner).proposalRole(tokenId, "Test Proposal");

      await roles.connect(owner).grantRole(DAO_ROLE, roleNFT.target, tokenId, addr1.address, expiration, "0x");

      await expect(roleGatedDAO.connect(addr1).voteRole(0, tokenId, true)).to.not.be.reverted;

      const proposal = await roleGatedDAO.proposals(0);
      expect(proposal.yesVotes).to.equal(0); // DAO_ROLE should not count as a voter
    });

    it("Should revert voting without VOTER_ROLE or DAO_ROLE", async function () {
      const { roleGatedDAO, roles, roleNFT, owner, addr1, tokenId } = await loadFixture(deployDAOFixture);
      const PROPOSER_ROLE = await roleGatedDAO.PROPOSER_ROLE();
      const expiration = Math.floor(Date.now() / 1000) + 3600;

      await roles.connect(owner).grantRole(PROPOSER_ROLE, roleNFT.target, tokenId, owner.address, expiration, "0x");
      await roleGatedDAO.connect(owner).proposalRole(tokenId, "Test Proposal");

      await expect(roleGatedDAO.connect(addr1).voteRole(0, tokenId, true))
        .to.be.revertedWith("No voter or DAO role");
    });

    it("Should allow DAO access with DAO_ROLE", async function () {
      const { roleGatedDAO, roles, roleNFT, owner, tokenId } = await loadFixture(deployDAOFixture);
      const DAO_ROLE = await roleGatedDAO.DAO_ROLE();
      const expiration = Math.floor(Date.now() / 1000) + 3600;

      await roles.connect(owner).grantRole(DAO_ROLE, roleNFT.target, tokenId, owner.address, expiration, "0x");

      expect(await roleGatedDAO.connect(owner).accessDAORole(tokenId)).to.equal(true);
    });

    it("Should deny DAO access without DAO_ROLE", async function () {
      const { roleGatedDAO, roles, roleNFT, owner, tokenId } = await loadFixture(deployDAOFixture);
      const VOTER_ROLE = await roleGatedDAO.VOTER_ROLE();
      const expiration = Math.floor(Date.now() / 1000) + 3600;

      await roles.connect(owner).grantRole(VOTER_ROLE, roleNFT.target, tokenId, owner.address, expiration, "0x");

      expect(await roleGatedDAO.connect(owner).accessDAORole(tokenId)).to.equal(false);
    });

    it("Should return correct permissions via checkRole", async function () {
      const { roles, roleGatedDAO, roleNFT, owner, tokenId } = await loadFixture(deployDAOFixture);
      const VOTER_ROLE = await roleGatedDAO.VOTER_ROLE();
      const PROPOSER_ROLE = await roleGatedDAO.PROPOSER_ROLE();
      const DAO_ROLE = await roleGatedDAO.DAO_ROLE();
      const expiration = Math.floor(Date.now() / 1000) + 3600;

      // Test NO_RIGHTS
      expect(await roles.checkRole(owner.address)).to.equal(0);

      // Test VOTING_RIGHTS
      await roles.connect(owner).grantRole(VOTER_ROLE, roleNFT.target, tokenId, owner.address, expiration, "0x");
      expect(await roles.checkRole(owner.address)).to.equal(1);

      // Test PROPOSAL_RIGHTS
      await roles.connect(owner).revokeRole(VOTER_ROLE, roleNFT.target, tokenId, owner.address);
      await roles.connect(owner).grantRole(PROPOSER_ROLE, roleNFT.target, tokenId, owner.address, expiration, "0x");
      expect(await roles.checkRole(owner.address)).to.equal(2); 

      // Test DAO_RIGHTS
      await roles.connect(owner).revokeRole(PROPOSER_ROLE, roleNFT.target, tokenId, owner.address);
      await roles.connect(owner).grantRole(DAO_ROLE, roleNFT.target, tokenId, owner.address, expiration, "0x");
      expect(await roles.checkRole(owner.address)).to.equal(3); 
    });
  });
});