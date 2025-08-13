import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { RoleNFT } from "../typechain-types";

describe("RoleNFT", function () {
  let roleNFT: RoleNFT;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;

  // Role constants
  let VOTER_ROLE: string;
  let PROPOSER_ROLE: string;
  let ADMIN_ROLE: string;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    
    // Deploy RoleNFT with required constructor parameters
    const RoleNFT = await ethers.getContractFactory("RoleNFT");
    roleNFT = await RoleNFT.deploy("DAO Role NFT", "DROLE");
    await roleNFT.deployed();

    // Get role constants
    VOTER_ROLE = await roleNFT.VOTER_ROLE();
    PROPOSER_ROLE = await roleNFT.PROPOSER_ROLE();
    ADMIN_ROLE = await roleNFT.ADMIN_ROLE();
  });

  describe("Basic NFT functionality", function () {
    it("Should mint NFTs with roles", async function () {
      const tokenURI = "https://example.com/token/1";
      const roles = [VOTER_ROLE, PROPOSER_ROLE];
      const expirations = [
        Math.floor(Date.now() / 1000) + 86400, // 1 day from now
        Math.floor(Date.now() / 1000) + 86400
      ];

      await roleNFT.mint(user1.address, tokenURI, roles, expirations);
      
      expect(await roleNFT.ownerOf(0)).to.equal(user1.address);
      expect(await roleNFT.tokenURI(0)).to.equal(tokenURI);
      expect(await roleNFT.totalSupply()).to.equal(1);
    });

    it("Should get active roles for a token", async function () {
      const tokenURI = "https://example.com/token/1";
      const roles = [VOTER_ROLE, ADMIN_ROLE];
      const expirations = [
        Math.floor(Date.now() / 1000) + 86400, // 1 day from now
        Math.floor(Date.now() / 1000) + 86400
      ];

      await roleNFT.mint(user1.address, tokenURI, roles, expirations);
      
      const activeRoles = await roleNFT.getActiveRoles(0);
      expect(activeRoles.length).to.equal(2);
      expect(activeRoles).to.include(VOTER_ROLE);
      expect(activeRoles).to.include(ADMIN_ROLE);
    });

    it("Should batch mint NFTs", async function () {
      const recipients = [user1.address, user2.address];
      const tokenURIs = ["https://example.com/token/1", "https://example.com/token/2"];
      const roles = [VOTER_ROLE];
      const expirations = [Math.floor(Date.now() / 1000) + 86400];

      await roleNFT.batchMint(recipients, tokenURIs, roles, expirations);
      
      expect(await roleNFT.ownerOf(0)).to.equal(user1.address);
      expect(await roleNFT.ownerOf(1)).to.equal(user2.address);
      expect(await roleNFT.totalSupply()).to.equal(2);
    });
  });

  describe("Role management", function () {
    beforeEach(async function () {
      // Mint an NFT for testing
      const tokenURI = "https://example.com/token/1";
      const roles = [VOTER_ROLE];
      const expirations = [Math.floor(Date.now() / 1000) + 86400];
      await roleNFT.mint(user1.address, tokenURI, roles, expirations);
    });

    it("Should batch grant roles", async function () {
      const tokenIds = [0];
      const expiration = Math.floor(Date.now() / 1000) + 86400;
      
      await roleNFT.batchGrantRole(PROPOSER_ROLE, tokenIds, expiration);
      
      const activeRoles = await roleNFT.getActiveRoles(0);
      expect(activeRoles).to.include(PROPOSER_ROLE);
    });

    it("Should handle role validation", async function () {
      // Check if token has voter role
      const activeRoles = await roleNFT.getActiveRoles(0);
      expect(activeRoles).to.include(VOTER_ROLE);
    });

    it("Should reject unauthorized role granting", async function () {
      const tokenIds = [0];
      const expiration = Math.floor(Date.now() / 1000) + 86400;
      
      await expect(
        roleNFT.connect(user1).batchGrantRole(PROPOSER_ROLE, tokenIds, expiration)
      ).to.be.revertedWith("RoleNFT: insufficient permission");
    });
  });

  describe("Edge cases", function () {
    it("Should handle invalid token queries", async function () {
      await expect(roleNFT.getActiveRoles(999)).to.be.revertedWith(
        "RoleNFT: query for nonexistent token"
      );
    });

    it("Should handle empty role arrays", async function () {
      const tokenURI = "https://example.com/token/1";
      const roles: string[] = [];
      const expirations: number[] = [];

      await roleNFT.mint(user1.address, tokenURI, roles, expirations);
      
      const activeRoles = await roleNFT.getActiveRoles(0);
      expect(activeRoles.length).to.equal(0);
    });

    it("Should reject mismatched roles and expirations", async function () {
      const tokenURI = "https://example.com/token/1";
      const roles = [VOTER_ROLE, PROPOSER_ROLE];
      const expirations = [Math.floor(Date.now() / 1000) + 86400]; // Only one expiration

      await expect(
        roleNFT.mint(user1.address, tokenURI, roles, expirations)
      ).to.be.revertedWith("RoleNFT: roles and expirations length mismatch");
    });
  });
});