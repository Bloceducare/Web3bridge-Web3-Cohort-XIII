import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  TokenGatedDAO,
  RoleNFT,
  RoleValidator,
  ProposalManager,
} from "../typechain-types";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("TokenGatedDAO", function () {
  async function deployDAOFixture() {
    const [owner, user1, user2, user3] = await ethers.getSigners();

    // Deploy RoleValidator first
    const RoleValidator = await ethers.getContractFactory("RoleValidator");
    const roleValidator = await RoleValidator.deploy();
    await roleValidator.deployed();

    // Deploy RoleNFT
    const RoleNFT = await ethers.getContractFactory("RoleNFT");
    const roleNFT = await RoleNFT.deploy("DAO Role NFT", "DROLE");
    await roleNFT.deployed();

    // Deploy TokenGatedDAO
    const TokenGatedDAO = await ethers.getContractFactory("TokenGatedDAO");
    const dao = await TokenGatedDAO.deploy(
      roleNFT.address,
      roleValidator.address
    );
    await dao.deployed();

    // Deploy ProposalManager
    const ProposalManager = await ethers.getContractFactory("ProposalManager");
    const proposalManager = await ProposalManager.deploy(dao.address);
    await proposalManager.deployed();

    // Get role constants
    const VOTER_ROLE = await roleNFT.VOTER_ROLE();
    const PROPOSER_ROLE = await roleNFT.PROPOSER_ROLE();
    const ADMIN_ROLE = await roleNFT.ADMIN_ROLE();
    const TREASURY_ROLE = await roleNFT.TREASURY_ROLE();
    const VETO_ROLE = await roleNFT.VETO_ROLE();

    // Mint NFTs with roles for testing
    const futureTimestamp = Math.floor(Date.now() / 1000) + 86400; // 1 day from now

    // User1 gets VOTER and PROPOSER roles
    await roleNFT.mint(
      user1.address,
      "https://example.com/token/1",
      [VOTER_ROLE, PROPOSER_ROLE],
      [futureTimestamp, futureTimestamp]
    );

    // User2 gets VOTER role
    await roleNFT.mint(
      user2.address,
      "https://example.com/token/2",
      [VOTER_ROLE],
      [futureTimestamp]
    );

    // User3 gets ADMIN and VETO roles
    await roleNFT.mint(
      user3.address,
      "https://example.com/token/3",
      [ADMIN_ROLE, VETO_ROLE],
      [futureTimestamp, futureTimestamp]
    );

    return {
      dao,
      roleNFT,
      roleValidator,
      proposalManager,
      owner,
      user1,
      user2,
      user3,
      VOTER_ROLE,
      PROPOSER_ROLE,
      ADMIN_ROLE,
      TREASURY_ROLE,
      VETO_ROLE,
    };
  }

  describe("Deployment", function () {
    it("Should deploy all contracts successfully", async function () {
      const { dao, roleNFT, roleValidator } = await loadFixture(
        deployDAOFixture
      );

      expect(await dao.nftContract()).to.equal(roleNFT.address);
      expect(await dao.roleValidator()).to.equal(roleValidator.address);
    });

    it("Should have correct initial settings", async function () {
      const { dao } = await loadFixture(deployDAOFixture);

      expect(await dao.votingDelay()).to.equal(86400); // 1 day
      expect(await dao.votingPeriod()).to.equal(604800); // 7 days
      expect(await dao.quorum()).to.equal(4);
      expect(await dao.proposalCounter()).to.equal(0);
    });
  });

  describe("NFT Role Management", function () {
    it("Should mint NFT with roles", async function () {
      const { roleNFT, user1, VOTER_ROLE } = await loadFixture(
        deployDAOFixture
      );

      expect(await roleNFT.ownerOf(0)).to.equal(user1.address);

      const activeRoles = await roleNFT.getActiveRoles(0);
      expect(activeRoles).to.include(VOTER_ROLE);
    });

    it("Should handle role expiration", async function () {
      const { roleNFT, user1, VOTER_ROLE } = await loadFixture(
        deployDAOFixture
      );

      // Create NFT with expired role
      const pastTimestamp = Math.floor(Date.now() / 1000) - 1000; // 1000 seconds ago

      await roleNFT.mint(
        user1.address,
        "https://example.com/expired",
        [VOTER_ROLE],
        [pastTimestamp]
      );

      const tokenId = (await roleNFT.totalSupply()) - 1;
      const activeRoles = await roleNFT.getActiveRoles(tokenId);
      expect(activeRoles).to.not.include(VOTER_ROLE);
    });

    it("Should batch grant roles", async function () {
      const { roleNFT, TREASURY_ROLE } = await loadFixture(deployDAOFixture);

      const tokenIds = [0, 1];
      const futureTimestamp = Math.floor(Date.now() / 1000) + 86400;

      await roleNFT.batchGrantRole(TREASURY_ROLE, tokenIds, futureTimestamp);

      const activeRoles0 = await roleNFT.getActiveRoles(0);
      const activeRoles1 = await roleNFT.getActiveRoles(1);

      expect(activeRoles0).to.include(TREASURY_ROLE);
      expect(activeRoles1).to.include(TREASURY_ROLE);
    });
  });

  describe("DAO Governance", function () {
    it("Should create proposal with PROPOSER_ROLE", async function () {
      const { dao, user1 } = await loadFixture(deployDAOFixture);

      const targets = [ethers.constants.AddressZero];
      const values = [0];
      const calldatas = ["0x"];
      const description = "Test proposal";

      await expect(
        dao.connect(user1).propose(targets, values, calldatas, description)
      ).to.emit(dao, "ProposalCreated");

      expect(await dao.proposalCounter()).to.equal(1);
    });

    it("Should reject proposal from non-PROPOSER", async function () {
      const { dao, user2 } = await loadFixture(deployDAOFixture);

      const targets = [ethers.constants.AddressZero];
      const values = [0];
      const calldatas = ["0x"];
      const description = "Test proposal";

      await expect(
        dao.connect(user2).propose(targets, values, calldatas, description)
      ).to.be.revertedWith("TokenGatedDAO: caller does not have required role");
    });

    it("Should allow voting with VOTER_ROLE", async function () {
      const { dao, user1, user2 } = await loadFixture(deployDAOFixture);

      // Create proposal
      const targets = [ethers.constants.AddressZero];
      const values = [0];
      const calldatas = ["0x"];
      const description = "Test proposal";

      await dao.connect(user1).propose(targets, values, calldatas, description);

      // Mine blocks to reach voting period
      for (let i = 0; i < 2; i++) {
        await ethers.provider.send("evm_mine", []);
      }

      // Vote
      await expect(
        dao.connect(user1).castVote(1, 1, "I support this proposal")
      ).to.emit(dao, "VoteCast");

      await expect(
        dao.connect(user2).castVote(1, 1, "I also support this")
      ).to.emit(dao, "VoteCast");

      const proposal = await dao.getProposal(1);
      expect(proposal.forVotes).to.equal(2);
    });

    it("Should handle proposal states correctly", async function () {
      const { dao, user1 } = await loadFixture(deployDAOFixture);

      // Create proposal
      const targets = [ethers.constants.AddressZero];
      const values = [0];
      const calldatas = ["0x"];
      const description = "Test proposal";

      await dao.connect(user1).propose(targets, values, calldatas, description);

      // Should be pending
      expect(await dao.state(1)).to.equal(0); // Pending

      // Mine blocks to reach voting period
      for (let i = 0; i < 2; i++) {
        await ethers.provider.send("evm_mine", []);
      }

      // Should be active
      expect(await dao.state(1)).to.equal(1); // Active
    });
  });

  describe("Advanced Features", function () {
    it("Should allow veto by VETO_ROLE holder", async function () {
      const { dao, user1, user3 } = await loadFixture(deployDAOFixture);

      // Create proposal
      const targets = [ethers.constants.AddressZero];
      const values = [0];
      const calldatas = ["0x"];
      const description = "Test proposal";

      await dao.connect(user1).propose(targets, values, calldatas, description);

      // Veto the proposal
      await expect(dao.connect(user3).veto(1)).to.emit(dao, "ProposalCanceled");

      expect(await dao.state(1)).to.equal(2); // Canceled
    });

    it("Should handle treasury deposits and withdrawals", async function () {
      const { dao, user3 } = await loadFixture(deployDAOFixture);

      // Deposit ETH to treasury
      const depositAmount = ethers.utils.parseEther("1.0");
      await dao.depositToTreasury({ value: depositAmount });

      expect(await dao.treasuryBalances(ethers.constants.AddressZero)).to.equal(
        depositAmount
      );

      // Grant TREASURY_ROLE to user3
      await dao
        .connect(user3)
        .updateSettings(
          await dao.votingDelay(),
          await dao.votingPeriod(),
          await dao.proposalThreshold(),
          await dao.quorum()
        );
    });

    it("Should update settings with ADMIN_ROLE", async function () {
      const { dao, user3 } = await loadFixture(deployDAOFixture);

      const newVotingDelay = 172800; // 2 days
      const newVotingPeriod = 1209600; // 14 days
      const newQuorum = 10;

      await dao.connect(user3).updateSettings(
        newVotingDelay,
        newVotingPeriod,
        1, // proposal threshold
        newQuorum
      );

      expect(await dao.votingDelay()).to.equal(newVotingDelay);
      expect(await dao.votingPeriod()).to.equal(newVotingPeriod);
      expect(await dao.quorum()).to.equal(newQuorum);
    });
  });

  describe("Proposal Manager", function () {
    it("Should create proposal templates", async function () {
      const { proposalManager, owner } = await loadFixture(deployDAOFixture);

      const templateName = "Treasury Withdrawal Template";
      const templateDescription = "Template for withdrawing from treasury";
      const targets = [ethers.constants.AddressZero];
      const values = [ethers.utils.parseEther("0.1")];
      const calldatas = ["0x"];

      await expect(
        proposalManager
          .connect(owner)
          .createTemplate(
            templateName,
            templateDescription,
            targets,
            values,
            calldatas
          )
      ).to.emit(proposalManager, "TemplateCreated");

      expect(await proposalManager.templateCounter()).to.equal(1);

      const template = await proposalManager.getTemplate(1);
      expect(template.name).to.equal(templateName);
      expect(template.active).to.be.true;
    });

    it("Should create proposals from templates", async function () {
      const { dao, proposalManager, owner, user1 } = await loadFixture(
        deployDAOFixture
      );

      // Create template first
      const templateName = "Test Template";
      const templateDescription = "Test Description";
      const targets = [ethers.constants.AddressZero];
      const values = [0];
      const calldatas = ["0x"];

      await proposalManager
        .connect(owner)
        .createTemplate(
          templateName,
          templateDescription,
          targets,
          values,
          calldatas
        );

      // Create proposal from template
      await expect(
        proposalManager
          .connect(user1)
          .createProposalFromTemplate(1, "Custom description")
      ).to.emit(proposalManager, "ProposalCreatedFromTemplate");

      expect(await dao.proposalCounter()).to.equal(1);
    });
  });

  describe("Role Validator", function () {
    it("Should validate roles correctly", async function () {
      const { dao, user1, VOTER_ROLE } = await loadFixture(deployDAOFixture);

      expect(await dao.hasRole(user1.address, VOTER_ROLE)).to.be.true;
      expect(await dao.hasRole(user1.address, await dao.TREASURY_ROLE())).to.be
        .false;
    });

    it("Should calculate voting power", async function () {
      const { dao, user1, user2 } = await loadFixture(deployDAOFixture);

      expect(await dao.getVotingPower(user1.address)).to.equal(1);
      expect(await dao.getVotingPower(user2.address)).to.equal(1);
    });
  });

  describe("Edge Cases", function () {
    it("Should handle expired roles properly", async function () {
      const { roleNFT, dao, owner, VOTER_ROLE } = await loadFixture(
        deployDAOFixture
      );

      const pastTimestamp = Math.floor(Date.now() / 1000) - 1000;

      await roleNFT.mint(
        owner.address,
        "https://example.com/expired",
        [VOTER_ROLE],
        [pastTimestamp]
      );

      expect(await dao.getVotingPower(owner.address)).to.equal(0);
    });

    it("Should handle multiple NFTs per user", async function () {
      const { roleNFT, dao, user1, VOTER_ROLE } = await loadFixture(
        deployDAOFixture
      );

      const futureTimestamp = Math.floor(Date.now() / 1000) + 86400;

      // Mint second NFT for user1
      await roleNFT.mint(
        user1.address,
        "https://example.com/token/second",
        [VOTER_ROLE],
        [futureTimestamp]
      );

      // Should have increased voting power
      expect(await dao.getVotingPower(user1.address)).to.equal(2);
    });

    it("Should reject invalid proposal parameters", async function () {
      const { dao, user1 } = await loadFixture(deployDAOFixture);

      const targets = [ethers.constants.AddressZero];
      const values = [0, 1]; // Mismatched lengths
      const calldatas = ["0x"];

      await expect(
        dao
          .connect(user1)
          .propose(targets, values, calldatas, "Invalid proposal")
      ).to.be.revertedWith(
        "TokenGatedDAO: proposal function information arity mismatch"
      );
    });
  });

  describe("Gas Optimization", function () {
    it("Should use reasonable gas for common operations", async function () {
      const { dao, user1 } = await loadFixture(deployDAOFixture);

      const targets = [ethers.constants.AddressZero];
      const values = [0];
      const calldatas = ["0x"];
      const description = "Gas test proposal";

      const tx = await dao
        .connect(user1)
        .propose(targets, values, calldatas, description);
      const receipt = await tx.wait();

      // Should use less than 500k gas for proposal creation
      expect(receipt.gasUsed.toNumber()).to.be.lessThan(500000);
    });
  });
});
