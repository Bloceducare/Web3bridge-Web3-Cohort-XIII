import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Contract } from "ethers";

describe("Token-Gated DAO with ERC-7432", function () {
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  
  let erc7432: Contract;
  let daoTokens: Contract;
  let daoRoles: Contract;
  
  const TOKEN_URI = "https://api.dao-token.com/token/1";
  
  before(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    
    // Deploy ERC7432
    const ERC7432 = await ethers.getContractFactory("ERC7432");
    erc7432 = await ERC7432.deploy(owner.address);
    await erc7432.deployed();
    
    // Deploy DAOToken
    const DAOToken = await ethers.getContractFactory("DAOToken");
    daoTokens = await DAOToken.deploy(
      "DAOToken",
      "DTK",
      "https://api.dao-token.com/token/",
      owner.address
    );
    await daoTokens.deployed();
    
    // Deploy DAORoles
    const DAORoles = await ethers.getContractFactory("DAORoles");
    daoRoles = await upgrades.deployProxy(
      DAORoles,
      [erc7432.address, daoTokens.address, owner.address],
      { initializer: 'initialize' }
    );
    await daoRoles.deployed();
    
    // Grant minter role to owner for testing
    const MINTER_ROLE = await daoTokens.MINTER_ROLE();
    await daoTokens.grantRole(MINTER_ROLE, owner.address);
  });
  
  describe("DAOToken", function () {
    it("should mint a new token", async function () {
      await expect(daoTokens.mint(user1.address, TOKEN_URI))
        .to.emit(daoTokens, "TokenMinted")
        .withArgs(user1.address, 1);
      
      expect(await daoTokens.ownerOf(1)).to.equal(user1.address);
      expect(await daoTokens.tokenURI(1)).to.equal(TOKEN_URI);
    });
    
    it("should set token URI", async function () {
      const newURI = "https://api.dao-token.com/token/1-updated";
      await daoTokens.setTokenURI(1, newURI);
      expect(await daoTokens.tokenURI(1)).to.equal(newURI);
    });
  });
  
  describe("ERC7432", function () {
    it("should grant a role to an NFT", async function () {
      const role = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("TEST_ROLE"));
      const expirationTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      
      await expect(
        erc7432.grantRole(role, daoTokens.address, 1, user1.address, expirationTime)
      )
        .to.emit(erc7432, "RoleGranted")
        .withArgs(role, daoTokens.address, 1, user1.address, expirationTime);
      
      const hasRole = await erc7432.hasRole(role, daoTokens.address, 1, user1.address);
      expect(hasRole).to.be.true;
    });
    
    it("should revoke a role from an NFT", async function () {
      const role = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("TEST_ROLE"));
      
      await expect(
        erc7432.revokeRole(role, daoTokens.address, 1, user1.address)
      )
        .to.emit(erc7432, "RoleRevoked")
        .withArgs(role, daoTokens.address, 1, user1.address);
      
      const hasRole = await erc7432.hasRole(role, daoTokens.address, 1, user1.address);
      expect(hasRole).to.be.false;
    });
  });
  
  describe("DAORoles", function () {
    it("should create a proposal", async function () {
      // Grant VOTER_ROLE to the token
      const VOTER_ROLE = await daoRoles.VOTER_ROLE();
      const expirationTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      
      await erc7432.grantRole(
        VOTER_ROLE,
        daoTokens.address,
        1, // tokenId
        user1.address,
        expirationTime
      );
      
      // Set voting power for the token
      await daoRoles.setTokenVotingPower(1, 100);
      
      // Create a proposal
      await daoRoles.connect(user1).createProposal("Test Proposal", 86400); // 1 day voting period
      
      const proposal = await daoRoles.proposals(1);
      expect(proposal.id).to.equal(1);
      expect(proposal.proposer).to.equal(user1.address);
      expect(proposal.description).to.equal("Test Proposal");
    });
    
    it("should allow voting on a proposal", async function () {
      // Vote on the proposal
      await expect(daoRoles.connect(user1).vote(1, true))
        .to.emit(daoRoles, "VoteCast")
        .withArgs(user1.address, 1, true, 100);
      
      const proposal = await daoRoles.proposals(1);
      expect(proposal.yesVotes).to.equal(100);
      expect(proposal.noVotes).to.equal(0);
    });
    
    it("should execute a proposal", async function () {
      // Fast forward time to end the voting period
      await ethers.provider.send("evm_increaseTime", [86401]); // 1 day + 1 second
      await ethers.provider.send("evm_mine", []);
      
      // Execute the proposal
      await expect(daoRoles.executeProposal(1))
        .to.emit(daoRoles, "ProposalExecuted")
        .withArgs(1);
      
      const proposal = await daoRoles.proposals(1);
      expect(proposal.executed).to.be.true;
      expect(proposal.passed).to.be.true;
    });
  });
});
