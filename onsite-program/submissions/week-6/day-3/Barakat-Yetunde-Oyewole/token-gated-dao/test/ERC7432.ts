import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { DAOMembershipNFT } from "../typechain-types";

describe("ERC7432 Complete Coverage", function () {
  let nft: DAOMembershipNFT;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let user3: SignerWithAddress;

  let testRole: string;

  beforeEach(async function () {
    [owner, user1, user2, user3] = await ethers.getSigners();

    const NFTFactory = await ethers.getContractFactory("DAOMembershipNFT");
    nft = await NFTFactory.deploy();
    await nft.waitForDeployment();

    testRole = ethers.keccak256(ethers.toUtf8Bytes("TEST_ROLE"));

    await nft.mintMembership(user1.address, "metadata1");
    await nft.mintMembership(user2.address, "metadata2");
    await nft.mintMembership(user3.address, "metadata3");
  });

  describe("Role Data and Expiration", function () {
    it("Should handle role data correctly", async function () {
      const roleData = "0x1234567890abcdef";
      await nft.connect(user1).grantRole(testRole, 0, user1.address, 0, roleData);
      
      const storedData = await nft.roleData(testRole, 0, user1.address);
      expect(storedData).to.equal(roleData);
    });

    it("Should return empty data for non-existent role", async function () {
      const data = await nft.roleData(testRole, 0, user1.address);
      expect(data).to.equal("0x");
    });

    it("Should return empty data for non-existent token", async function () {
      const data = await nft.roleData(testRole, 999, user1.address);
      expect(data).to.equal("0x");
    });

    it("Should return 0 expiration date for non-existent role", async function () {
      const expiration = await nft.roleExpirationDate(testRole, 0, user1.address);
      expect(expiration).to.equal(0);
    });

    it("Should return 0 expiration date for non-existent token", async function () {
      const expiration = await nft.roleExpirationDate(testRole, 999, user1.address);
      expect(expiration).to.equal(0);
    });

    it("Should handle hasRole for non-existent token", async function () {
      const hasRole = await nft.hasRole(testRole, 999, user1.address);
      expect(hasRole).to.be.false;
    });
  });

  describe("Role Approval System", function () {
    it("Should set and check role approvals", async function () {
      await nft.connect(user1).setRoleApprovalForAll(user2.address, true);
      expect(await nft.isRoleApprovedForAll(user1.address, user2.address)).to.be.true;

      await nft.connect(user1).setRoleApprovalForAll(user2.address, false);
      expect(await nft.isRoleApprovedForAll(user1.address, user2.address)).to.be.false;
    });

    it("Should reject self-approval", async function () {
      await expect(
        nft.connect(user1).setRoleApprovalForAll(user1.address, true)
      ).to.be.revertedWith("ERC7432: approve to caller");
    });

    it("Should allow approved operator to grant roles", async function () {
      await nft.connect(user1).setRoleApprovalForAll(user2.address, true);
      
      expect(await nft.isRoleApprovedForAll(user1.address, user2.address)).to.be.true;
      
      await nft.connect(user2).grantRole(testRole, 0, user3.address, 0, "0x01");
      expect(await nft.hasRole(testRole, 0, user3.address)).to.be.true;
    });

    it("Should allow approved operator to revoke roles", async function () {
      await nft.connect(user1).grantRole(testRole, 0, user3.address, 0, "0x");
      await nft.connect(user1).setRoleApprovalForAll(user2.address, true);
      
      await nft.connect(user2).revokeRole(testRole, 0, user3.address);
      expect(await nft.hasRole(testRole, 0, user3.address)).to.be.false;
    });
  });

  describe("Error Conditions", function () {
    it("Should reject granting role to zero address", async function () {
      await expect(
        nft.connect(user1).grantRole(testRole, 0, ethers.ZeroAddress, 0, "0x")
      ).to.be.revertedWith("ERC7432: grant role to zero address");
    });

    it("Should reject granting role for non-existent token", async function () {
      await expect(
        nft.connect(user1).grantRole(testRole, 999, user2.address, 0, "0x")
      ).to.be.revertedWith("ERC7432: caller is not owner nor approved");
    });

    it("Should reject revoking role for non-existent token", async function () {
      await expect(
        nft.connect(user1).revokeRole(testRole, 999, user2.address)
      ).to.be.revertedWith("ERC7432: caller is not owner nor approved");
    });

    it("Should reject unauthorized role operations", async function () {
      await expect(
        nft.connect(user2).grantRole(testRole, 0, user3.address, 0, "0x")
      ).to.be.revertedWith("ERC7432: caller is not owner nor approved");

      await expect(
        nft.connect(user2).revokeRole(testRole, 0, user3.address)
      ).to.be.revertedWith("ERC7432: caller is not owner nor approved");
    });
  });

  describe("Interface Support", function () {
    it("Should support ERC7432 interface", async function () {
      
      const selectors = [
        "0x" + ethers.keccak256(ethers.toUtf8Bytes("grantRole(bytes32,uint256,address,uint64,bytes)")).slice(2, 10),
        "0x" + ethers.keccak256(ethers.toUtf8Bytes("revokeRole(bytes32,uint256,address)")).slice(2, 10),
        "0x" + ethers.keccak256(ethers.toUtf8Bytes("hasRole(bytes32,uint256,address)")).slice(2, 10),
        "0x" + ethers.keccak256(ethers.toUtf8Bytes("roleExpirationDate(bytes32,uint256,address)")).slice(2, 10),
        "0x" + ethers.keccak256(ethers.toUtf8Bytes("roleData(bytes32,uint256,address)")).slice(2, 10),
        "0x" + ethers.keccak256(ethers.toUtf8Bytes("setRoleApprovalForAll(address,bool)")).slice(2, 10),
        "0x" + ethers.keccak256(ethers.toUtf8Bytes("isRoleApprovedForAll(address,address)")).slice(2, 10)
      ];
      
      let interfaceId = 0;
      for (const selector of selectors) {
        interfaceId ^= parseInt(selector, 16);
      }
      
      const interfaceIdHex = "0x" + interfaceId.toString(16).padStart(8, '0');
      expect(await nft.supportsInterface(interfaceIdHex)).to.be.true;
    });

    it("Should support ERC165 interface", async function () {
      const erc165InterfaceId = "0x01ffc9a7";
      expect(await nft.supportsInterface(erc165InterfaceId)).to.be.true;
    });

    it("Should support ERC721 interface", async function () {
      const erc721InterfaceId = "0x80ac58cd";
      expect(await nft.supportsInterface(erc721InterfaceId)).to.be.true;
    });
  });

  describe("Role with Data and Complex Scenarios", function () {
    it("Should handle role with data and expiration", async function () {
      const currentBlock = await ethers.provider.getBlock('latest');
      const expirationDate = currentBlock!.timestamp + 100;
      const roleData = "0xdeadbeef";

      await nft.connect(user1).grantRole(testRole, 0, user2.address, expirationDate, roleData);
      
      expect(await nft.hasRole(testRole, 0, user2.address)).to.be.true;
      expect(await nft.roleData(testRole, 0, user2.address)).to.equal(roleData);
      expect(await nft.roleExpirationDate(testRole, 0, user2.address)).to.equal(expirationDate);
    });

    it("Should handle multiple roles for same user", async function () {
      const role1 = ethers.keccak256(ethers.toUtf8Bytes("ROLE1"));
      const role2 = ethers.keccak256(ethers.toUtf8Bytes("ROLE2"));

      await nft.connect(user1).grantRole(role1, 0, user2.address, 0, "0x01");
      await nft.connect(user1).grantRole(role2, 0, user2.address, 0, "0x02");

      expect(await nft.hasRole(role1, 0, user2.address)).to.be.true;
      expect(await nft.hasRole(role2, 0, user2.address)).to.be.true;
      expect(await nft.roleData(role1, 0, user2.address)).to.equal("0x01");
      expect(await nft.roleData(role2, 0, user2.address)).to.equal("0x02");
    });

    it("Should handle role updates", async function () {
      const roleData1 = "0x01";
      const roleData2 = "0x02";

      await nft.connect(user1).grantRole(testRole, 0, user2.address, 0, roleData1);
      expect(await nft.roleData(testRole, 0, user2.address)).to.equal(roleData1);

      await nft.connect(user1).grantRole(testRole, 0, user2.address, 0, roleData2);
      expect(await nft.roleData(testRole, 0, user2.address)).to.equal(roleData2);
    });
  });

  describe("DAOMembershipNFT Specific Coverage", function () {
    it("Should reject invalid DAO role", async function () {
      const invalidRole = ethers.keccak256(ethers.toUtf8Bytes("INVALID_ROLE"));
      await expect(
        nft.grantDAORole(invalidRole, 0, user1.address, 0)
      ).to.be.revertedWith("DAOMembershipNFT: Invalid DAO role");
    });

    it("Should reject setting token URI for non-existent token", async function () {
      await expect(
        nft.setTokenURI(999, "new-uri")
      ).to.be.revertedWith("DAOMembershipNFT: URI set of nonexistent token");
    });

    it("Should reject token URI query for non-existent token", async function () {
      await expect(
        nft.tokenURI(999)
      ).to.be.revertedWith("DAOMembershipNFT: URI query for nonexistent token");
    });

    it("Should update token URI correctly", async function () {
      const newURI = "https://new-metadata.com/1";
      await nft.setTokenURI(0, newURI);
      expect(await nft.tokenURI(0)).to.equal(newURI);
    });

    it("Should handle all DAO roles correctly", async function () {
      const adminRole = await nft.ADMIN_ROLE();
      const voterRole = await nft.VOTER_ROLE();
      const proposerRole = await nft.PROPOSER_ROLE();
      const executorRole = await nft.EXECUTOR_ROLE();

      await nft.grantDAORole(adminRole, 0, user1.address, 0);
      await nft.grantDAORole(voterRole, 1, user2.address, 0);
      await nft.grantDAORole(proposerRole, 2, user3.address, 0);
      await nft.grantDAORole(executorRole, 0, user1.address, 0);

      expect(await nft.hasRole(adminRole, 0, user1.address)).to.be.true;
      expect(await nft.hasRole(voterRole, 1, user2.address)).to.be.true;
      expect(await nft.hasRole(proposerRole, 2, user3.address)).to.be.true;
      expect(await nft.hasRole(executorRole, 0, user1.address)).to.be.true;
    });
  });

  describe("Edge Cases and Boundary Conditions", function () {
    it("Should handle permanent roles with max uint64 expiration", async function () {
      const maxUint64 = "18446744073709551615"; 
      await nft.connect(user1).grantRole(testRole, 0, user2.address, maxUint64, "0x");
      
      expect(await nft.hasRole(testRole, 0, user2.address)).to.be.true;
      expect(await nft.roleExpirationDate(testRole, 0, user2.address)).to.equal(maxUint64);
    });

    it("Should handle role at exact expiration timestamp", async function () {
      const currentBlock = await ethers.provider.getBlock('latest');
      const expirationDate = currentBlock!.timestamp + 5;

      await nft.connect(user1).grantRole(testRole, 0, user2.address, expirationDate, "0x01");
      expect(await nft.hasRole(testRole, 0, user2.address)).to.be.true;

      await ethers.provider.send("evm_increaseTime", [10]);
      await ethers.provider.send("evm_mine", []);

      expect(await nft.hasRole(testRole, 0, user2.address)).to.be.false;
    });

    it("Should handle zero expiration date with data (not permanent)", async function () {
      await nft.connect(user1).grantRole(testRole, 0, user2.address, 0, "0x01");
      expect(await nft.hasRole(testRole, 0, user2.address)).to.be.true;
      expect(await nft.roleExpirationDate(testRole, 0, user2.address)).to.equal(0);
    });

    it("Should handle empty data with future expiration", async function () {
      const currentBlock = await ethers.provider.getBlock('latest');
      const expirationDate = currentBlock!.timestamp + 100;

      await nft.connect(user1).grantRole(testRole, 0, user2.address, expirationDate, "0x");
      expect(await nft.hasRole(testRole, 0, user2.address)).to.be.true;
      expect(await nft.roleData(testRole, 0, user2.address)).to.equal("0x");
    });
  });
});
