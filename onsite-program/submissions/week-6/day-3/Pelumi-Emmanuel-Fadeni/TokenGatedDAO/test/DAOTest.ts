import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { MyNFT, RolesRegistry, TokenGatedDAO } from "../typechain-types";

async function deployDAOContracts() {
  const [owner, user1, user2] = await ethers.getSigners();

  // Deploy MyNFT contract
  const MyNFT = await ethers.getContractFactory("MyNFT");
  const nft: MyNFT = await MyNFT.deploy() as MyNFT;
  await nft.waitForDeployment();

  // Deploy RolesRegistry contract
  const RolesRegistry = await ethers.getContractFactory("RolesRegistry");
  const roles: RolesRegistry = await RolesRegistry.deploy() as RolesRegistry;
  await roles.waitForDeployment();

  // Deploy TokenGatedDAO contract
  const TokenGatedDAO = await ethers.getContractFactory("TokenGatedDAO");
  const dao: TokenGatedDAO = await TokenGatedDAO.deploy(await nft.getAddress(), await roles.getAddress()) as TokenGatedDAO;
  await dao.waitForDeployment();

  return { nft, roles, dao, owner, user1, user2 };
}

describe("TokenGatedDAO Testing", function () {
  describe("MyNFT Contract Tests", function () {
    it("Should mint an NFT to user1", async function () {
      const { nft, user1 } = await loadFixture(deployDAOContracts);
      await nft.connect(user1).mint(user1.address);
      expect(await nft.ownerOf(1)).to.equal(user1.address);
    });

    it("Should increment tokenId correctly", async function () {
      const { nft, user1, user2 } = await loadFixture(deployDAOContracts);
      await nft.connect(user1).mint(user1.address);
      await nft.connect(user2).mint(user2.address);
      expect(await nft.ownerOf(1)).to.equal(user1.address);
      expect(await nft.ownerOf(2)).to.equal(user2.address);
    });
  });

  describe("RolesRegistry Contract Tests", function () {
    it("Should grant MEMBER role to user1 for NFT #1", async function () {
      const { nft, roles, user1 } = await loadFixture(deployDAOContracts);
      await nft.connect(user1).mint(user1.address);

      const role = {
        roleId: ethers.keccak256(ethers.toUtf8Bytes("MEMBER")),
        tokenAddress: await nft.getAddress(),
        tokenId: 1,
        recipient: user1.address,
        expirationDate: Math.floor(Date.now() / 1000) + 86400, // 1 day from now
        revocable: true,
        data: "0x",
      };

      await roles.connect(user1).grantRole(role);
      expect(await roles.recipientOf(await nft.getAddress(), 1, role.roleId)).to.equal(user1.address);
    });

    it("Should revert if non-owner tries to grant role", async function () {
      const { nft, roles, user1, user2 } = await loadFixture(deployDAOContracts);
      await nft.connect(user1).mint(user1.address);

      const role = {
        roleId: ethers.keccak256(ethers.toUtf8Bytes("MEMBER")),
        tokenAddress: await nft.getAddress(),
        tokenId: 1,
        recipient: user1.address,
        expirationDate: Math.floor(Date.now() / 1000) + 86400,
        revocable: true,
        data: "0x",
      };

      await expect(roles.connect(user2).grantRole(role)).to.be.revertedWith("Not authorized");
    });
  });

  describe("TokenGatedDAO Contract Tests", function () {
    async function createMemberAccount() {
      const { nft, roles, dao, owner, user1 } = await loadFixture(deployDAOContracts);
      await nft.connect(owner).mint(user1.address);

      const role = {
        roleId: ethers.keccak256(ethers.toUtf8Bytes("MEMBER")),
        tokenAddress: await nft.getAddress(),
        tokenId: 1,
        recipient: user1.address,
        expirationDate: Math.floor(Date.now() / 1000) + 86400,
        revocable: true,
        data: "0x",
      };
      await roles.connect(user1).grantRole(role);

      return { nft, roles, dao, owner, user1 };
    }


    it("Should reject non-member proposals", async function () {
      const { dao, user1 } = await loadFixture(deployDAOContracts); // No role granted
      await expect(dao.connect(user1).propose("Test proposal")).to.be.revertedWith("Must have MEMBER role");
    });

    it("Should allow member to vote", async function () {
      const { dao, user1 } = await loadFixture(createMemberAccount);
      await dao.connect(user1).propose("Test proposal");
      await expect(dao.connect(user1).vote(1, true)).to.emit(dao, "Voted").withArgs(1, user1.address, true);
    });

    
  });
});