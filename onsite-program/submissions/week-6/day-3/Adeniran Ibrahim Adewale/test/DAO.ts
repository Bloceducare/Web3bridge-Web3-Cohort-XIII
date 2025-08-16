const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("TokenGatedDAO and RolesRegistry", function () {
  // Fixture function that sets up the test environment
  async function deployContractsFixture() {
    const [owner, proposer, voter1, voter2, voter3, other] = await ethers.getSigners();
    
    // Deploy mock ERC721 token for testing
    const MockERC721Factory = await ethers.getContractFactory("MockERC721");
    const mockToken = await MockERC721Factory.deploy("TestNFT", "TNFT");
    await mockToken.waitForDeployment();
    
    // Deploy RolesRegistry
    const RolesRegistryFactory = await ethers.getContractFactory("RolesRegistry");
    const rolesRegistry = await RolesRegistryFactory.deploy();
    await rolesRegistry.waitForDeployment();
    
    // Deploy TokenGatedDAO
    const TokenGatedDAOFactory = await ethers.getContractFactory("TokenGatedDAO");
    const dao = await TokenGatedDAOFactory.deploy(await rolesRegistry.getAddress());
    await dao.waitForDeployment();
    
    // Mint some NFTs for testing
    await mockToken.mint(owner.address, 1);
    await mockToken.mint(proposer.address, 2);
    await mockToken.mint(voter1.address, 3);
    await mockToken.mint(voter2.address, 4);
    await mockToken.mint(voter3.address, 5);
    
    // Define role constants
    const ROLE_PROPOSER = ethers.keccak256(ethers.toUtf8Bytes("DAO_PROPOSER"));
    const ROLE_VOTER = ethers.keccak256(ethers.toUtf8Bytes("DAO_VOTER"));
    
    // Grant roles for testing
    const currentTime = Math.floor(Date.now() / 1000);
    const futureTime = currentTime + 86400; // 24 hours from now
    
    // Grant proposer role to proposer
    await rolesRegistry.connect(proposer).grantRole({
      tokenAddress: await mockToken.getAddress(),
      tokenId: 2,
      roleId: ROLE_PROPOSER,
      recipient: proposer.address,
      expirationDate: futureTime,
      revocable: true,
      data: "0x"
    });
    
    // Grant voter roles to voters
    await rolesRegistry.connect(voter1).grantRole({
      tokenAddress: await mockToken.getAddress(),
      tokenId: 3,
      roleId: ROLE_VOTER,
      recipient: voter1.address,
      expirationDate: futureTime,
      revocable: true,
      data: "0x"
    });
    
    await rolesRegistry.connect(voter2).grantRole({
      tokenAddress: await mockToken.getAddress(),
      tokenId: 4,
      roleId: ROLE_VOTER,
      recipient: voter2.address,
      expirationDate: futureTime,
      revocable: true,
      data: "0x"
    });
    
    await rolesRegistry.connect(voter3).grantRole({
      tokenAddress: await mockToken.getAddress(),
      tokenId: 5,
      roleId: ROLE_VOTER,
      recipient: voter3.address,
      expirationDate: futureTime,
      revocable: true,
      data: "0x"
    });
    
    return {
      dao,
      rolesRegistry,
      mockToken,
      owner,
      proposer,
      voter1,
      voter2,
      voter3,
      other,
      ROLE_PROPOSER,
      ROLE_VOTER,
      futureTime
    };
  }
  
  describe("Contract Deployment", function () {
    it("Should deploy all contracts successfully", async function () {
      const { dao, rolesRegistry, mockToken } = await loadFixture(deployContractsFixture);
      expect(await dao.getAddress()).to.be.properAddress;
      expect(await rolesRegistry.getAddress()).to.be.properAddress;
      expect(await mockToken.getAddress()).to.be.properAddress;
    });
    
    it("Should set the correct roles registry in DAO", async function () {
      const { dao, rolesRegistry } = await loadFixture(deployContractsFixture);
      expect(await dao.rolesRegistry()).to.equal(await rolesRegistry.getAddress());
    });
    
    it("Should initialize proposal count to 0", async function () {
      const { dao } = await loadFixture(deployContractsFixture);
      expect(await dao.proposalCount()).to.equal(0);
    });
  });
  
  describe("RolesRegistry", function () {
    it("Should grant role successfully", async function () {
      const { rolesRegistry, mockToken, owner, other } = await loadFixture(deployContractsFixture);
      
      const roleId = ethers.keccak256(ethers.toUtf8Bytes("TEST_ROLE"));
      const futureTime = Math.floor(Date.now() / 1000) + 86400;
      
      await expect(
        rolesRegistry.connect(owner).grantRole({
          tokenAddress: await mockToken.getAddress(),
          tokenId: 1,
          roleId: roleId,
          recipient: other.address,
          expirationDate: futureTime,
          revocable: true,
          data: "0x"
        })
      ).to.emit(rolesRegistry, "RoleGranted");
      
      expect(await rolesRegistry.recipientOf(await mockToken.getAddress(), 1, roleId)).to.equal(other.address);
    });
    
    it("Should revoke role successfully", async function () {
      const { rolesRegistry, mockToken, owner, other } = await loadFixture(deployContractsFixture);
      
      const roleId = ethers.keccak256(ethers.toUtf8Bytes("TEST_ROLE"));
      const futureTime = Math.floor(Date.now() / 1000) + 86400;
      
      // Grant role first
      await rolesRegistry.connect(owner).grantRole({
        tokenAddress: await mockToken.getAddress(),
        tokenId: 1,
        roleId: roleId,
        recipient: other.address,
        expirationDate: futureTime,
        revocable: true,
        data: "0x"
      });
      
      // Then revoke it
      await expect(
        rolesRegistry.connect(owner).revokeRole(await mockToken.getAddress(), 1, roleId)
      ).to.emit(rolesRegistry, "RoleRevoked");
      
      expect(await rolesRegistry.recipientOf(await mockToken.getAddress(), 1, roleId)).to.equal(ethers.ZeroAddress);
    });
    
    it("Should check active role correctly", async function () {
      const { rolesRegistry, mockToken, voter1, ROLE_VOTER } = await loadFixture(deployContractsFixture);
      
      expect(await rolesRegistry.hasActiveRole(await mockToken.getAddress(), 3, ROLE_VOTER)).to.be.true;
    });
  });
  
  describe("TokenGatedDAO - Proposals", function () {
    it("Should allow authorized user to create proposal", async function () {
      const { dao, mockToken, proposer, ROLE_PROPOSER } = await loadFixture(deployContractsFixture);
      
      const targets = [await mockToken.getAddress()];
      const values = [0];
      const calldatas = ["0x"];
      const description = "Test proposal";
      const tokenIds = [2];
      
      await expect(
        dao.connect(proposer).propose(
          targets,
          values,
          calldatas,
          description,
          await mockToken.getAddress(),
          tokenIds,
          ROLE_PROPOSER
        )
      ).to.emit(dao, "ProposalCreated");
      
      expect(await dao.proposalCount()).to.equal(1);
    });
    
    it("Should revert if user is not authorized to propose", async function () {
      const { dao, mockToken, other, ROLE_PROPOSER } = await loadFixture(deployContractsFixture);
      
      const targets = [await mockToken.getAddress()];
      const values = [0];
      const calldatas = ["0x"];
      const description = "Test proposal";
      const tokenIds = [1]; // other doesn't have proposer role on this token
      
      await expect(
        dao.connect(other).propose(
          targets,
          values,
          calldatas,
          description,
          await mockToken.getAddress(),
          tokenIds,
          ROLE_PROPOSER
        )
      ).to.be.revertedWith("Not authorized to propose");
    });
    
    it("Should store proposal data correctly", async function () {
      const { dao, mockToken, proposer, ROLE_PROPOSER } = await loadFixture(deployContractsFixture);
      
      const targets = [await mockToken.getAddress()];
      const values = [0];
      const calldatas = ["0x"];
      const description = "Test proposal";
      const tokenIds = [2];
      
      const tx = await dao.connect(proposer).propose(
        targets,
        values,
        calldatas,
        description,
        await mockToken.getAddress(),
        tokenIds,
        ROLE_PROPOSER
      );
      
      const receipt = await tx.wait();
      const startBlock = receipt.blockNumber;
      
      const proposal = await dao.proposalsData(1);
      expect(proposal.id).to.equal(1);
      expect(proposal.proposer).to.equal(proposer.address);
      expect(proposal.startBlock).to.equal(startBlock);
      expect(proposal.endBlock).to.equal(startBlock + 100);
      expect(proposal.forVotes).to.equal(0);
      expect(proposal.againstVotes).to.equal(0);
      expect(proposal.executed).to.be.false;
      expect(proposal.canceled).to.be.false;
    });
  });
  
  describe("TokenGatedDAO - Voting", function () {
    async function createProposalFixture() {
      const fixture = await loadFixture(deployContractsFixture);
      const { dao, mockToken, proposer, ROLE_PROPOSER } = fixture;
      
      // Create a proposal
      await dao.connect(proposer).propose(
        [await mockToken.getAddress()],
        [0],
        ["0x"],
        "Test proposal",
        await mockToken.getAddress(),
        [2],
        ROLE_PROPOSER
      );
      
      return fixture;
    }
    
    it("Should allow authorized voters to cast votes", async function () {
      const { dao, mockToken, voter1 } = await loadFixture(createProposalFixture);
      
      await expect(
        dao.connect(voter1).castVoteWithTokens(
          1,
          true,
          await mockToken.getAddress(),
          [3]
        )
      ).to.emit(dao, "VoteCast");
      
      const proposal = await dao.proposalsData(1);
      expect(proposal.forVotes).to.equal(1);
      expect(proposal.againstVotes).to.equal(0);
    });
    
    it("Should prevent double voting with same token", async function () {
      const { dao, mockToken, voter1 } = await loadFixture(createProposalFixture);
      
      // First vote
      await dao.connect(voter1).castVoteWithTokens(
        1,
        true,
        await mockToken.getAddress(),
        [3]
      );
      
      // Second vote with same token should fail
      await expect(
        dao.connect(voter1).castVoteWithTokens(
          1,
          false,
          await mockToken.getAddress(),
          [3]
        )
      ).to.be.revertedWith("Token already voted");
    });
    
    it("Should prevent unauthorized users from voting", async function () {
      const { dao, mockToken, other } = await loadFixture(createProposalFixture);
      
      await expect(
        dao.connect(other).castVoteWithTokens(
          1,
          true,
          await mockToken.getAddress(),
          [1]
        )
      ).to.be.revertedWith("Not authorized voter");
    });
    
    it("Should count multiple votes correctly", async function () {
      const { dao, mockToken, voter1, voter2 } = await loadFixture(createProposalFixture);
      
      // Voter1 votes for
      await dao.connect(voter1).castVoteWithTokens(
        1,
        true,
        await mockToken.getAddress(),
        [3]
      );
      
      // Voter2 votes against
      await dao.connect(voter2).castVoteWithTokens(
        1,
        false,
        await mockToken.getAddress(),
        [4]
      );
      
      const proposal = await dao.proposalsData(1);
      expect(proposal.forVotes).to.equal(1);
      expect(proposal.againstVotes).to.equal(1);
    });
  });
  
  describe("TokenGatedDAO - Proposal States", function () {
    async function createProposalFixture() {
      const fixture = await loadFixture(deployContractsFixture);
      const { dao, mockToken, proposer, ROLE_PROPOSER } = fixture;
      
      await dao.connect(proposer).propose(
        [await mockToken.getAddress()],
        [0],
        ["0x"],
        "Test proposal",
        await mockToken.getAddress(),
        [2],
        ROLE_PROPOSER
      );
      
      return fixture;
    }
    
    it("Should return active state during voting period", async function () {
      const { dao } = await loadFixture(createProposalFixture);
      expect(await dao.state(1)).to.equal(1); // active
    });
    
    it("Should return finished state after voting period", async function () {
      const { dao } = await loadFixture(createProposalFixture);
      
      // Mine 101 blocks to end voting period
      for (let i = 0; i < 101; i++) {
        await ethers.provider.send("evm_mine");
      }
      
      expect(await dao.state(1)).to.equal(3); // finished
    });
  });
  
  describe("TokenGatedDAO - Voting Power", function () {
    it("Should return correct voting power", async function () {
      const { dao, mockToken, voter1, voter2, other } = await loadFixture(deployContractsFixture);
      
      // Voter1 has voting role on token 3
      expect(await dao.votingPower(voter1.address, await mockToken.getAddress(), [3])).to.equal(1);
      
      // Voter2 has voting role on token 4
      expect(await dao.votingPower(voter2.address, await mockToken.getAddress(), [4])).to.equal(1);
      
      // Other has no voting role
      expect(await dao.votingPower(other.address, await mockToken.getAddress(), [1])).to.equal(0);
    });
  });
  
  describe("TokenGatedDAO - Placeholder Functions", function () {
    it("Should have working placeholder functions", async function () {
      const { dao } = await loadFixture(deployContractsFixture);
      
      // These are empty functions that should not revert
      await expect(dao.queue(1)).to.not.be.reverted;
      await expect(dao.execute(1)).to.not.be.reverted;
      await expect(dao.cancel(1)).to.not.be.reverted;
    });
  });
});

// You'll also need this mock contract - save it as contracts/MockERC721.sol
/*
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MockERC721 {
    string public name;
    string public symbol;
    
    mapping(uint256 => address) private _owners;
    mapping(address => uint256) private _balances;
    
    constructor(string memory _name, string memory _symbol) {
        name = _name;
        symbol = _symbol;
    }
    
    function mint(address to, uint256 tokenId) public {
        require(_owners[tokenId] == address(0), "Token already exists");
        _owners[tokenId] = to;
        _balances[to]++;
    }
    
    function ownerOf(address, uint256 tokenId) public view returns (address) {
        address owner = _owners[tokenId];
        require(owner != address(0), "Token does not exist");
        return owner;
    }
    
    function balanceOf(address owner) public view returns (uint256) {
        require(owner != address(0), "Invalid owner address");
        return _balances[owner];
    }
}
*/