import { expect } from "chai";
import { ethers } from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ERC7432 } from "../typechain-types";

describe("ERC7432", function () {
  let erc7432: ERC7432;
  let owner: HardhatEthersSigner;
  let grantee: HardhatEthersSigner;
  let tokenAddress: string;
  let tokenId: number;
  let expirationDate: number;
  let data: string;

  const VOTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("VOTER"));
  const PROPOSER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("PROPOSER"));

  beforeEach(async function () {
    // Get signers
    [owner, grantee] = await ethers.getSigners();

    const ERC7432Factory = await ethers.getContractFactory("ERC7432");
    erc7432 = await ERC7432Factory.deploy();
    await erc7432.waitForDeployment();

    // get random address to serve for nft address
    tokenAddress = ethers.Wallet.createRandom().address;
    tokenId = 1;
    expirationDate = Math.floor(Date.now() / 1000) + 86400; // 1 day from now
    data = ethers.hexlify(ethers.toUtf8Bytes("test data"));
  });

  describe("grantRole", function () {
    it("should grant a role successfully", async function () {
      const role = VOTER_ROLE;
      await expect(
        erc7432
          .connect(owner)
          .grantRole(
            role,
            tokenAddress,
            tokenId,
            grantee.address,
            expirationDate,
            data
          )
      )
        .to.emit(erc7432, "RoleGranted")
        .withArgs(
          role,
          tokenAddress,
          tokenId,
          grantee.address,
          expirationDate,
          data
        );

      const hasRole = await erc7432.hasRole(
        role,
        tokenAddress,
        tokenId,
        owner.address,
        grantee.address
      );
      expect(hasRole).to.be.true;

      const roleData = await erc7432.roleData(
        role,
        tokenAddress,
        tokenId,
        owner.address,
        grantee.address
      );
      expect(roleData).to.equal(data);

      const roleExpiration = await erc7432.roleExpirationDate(
        role,
        tokenAddress,
        tokenId,
        owner.address,
        grantee.address
      );
      expect(roleExpiration).to.equal(expirationDate);
    });

    it("should revert if expiration date is in the past", async function () {
      const pastExpiration = Math.floor(Date.now() / 1000) - 1000;
      const role = VOTER_ROLE;

      await expect(
        erc7432
          .connect(owner)
          .grantRole(
            role,
            tokenAddress,
            tokenId,
            grantee.address,
            pastExpiration,
            data
          )
      ).to.be.revertedWith("ERC7432: expiration date must be in the future");
    });
  });

  describe("revokeRole", function () {
    it("should revoke a role successfully", async function () {
      const role = VOTER_ROLE;

      await erc7432
        .connect(owner)
        .grantRole(
          role,
          tokenAddress,
          tokenId,
          grantee.address,
          expirationDate,
          data
        );

      await expect(
        erc7432
          .connect(owner)
          .revokeRole(role, tokenAddress, tokenId, grantee.address)
      )
        .to.emit(erc7432, "RoleRevoked")
        .withArgs(role, tokenAddress, tokenId, grantee.address);

      const hasRole = await erc7432.hasRole(
        role,
        tokenAddress,
        tokenId,
        owner.address,
        grantee.address
      );
      expect(hasRole).to.be.false;
    });
  });

  describe("hasUniqueRole", function () {
    it("should return true for the latest grantee", async function () {
      const role = VOTER_ROLE;

      await erc7432
        .connect(owner)
        .grantRole(
          role,
          tokenAddress,
          tokenId,
          grantee.address,
          expirationDate,
          data
        );

      const isUnique = await erc7432.hasUniqueRole(
        role,
        tokenAddress,
        tokenId,
        owner.address,
        grantee.address
      );
      expect(isUnique).to.be.true;
    });

    it("should return false for a non-latest grantee", async function () {
      const anotherGrantee = (await ethers.getSigners())[2];
      const role = PROPOSER_ROLE;

      await erc7432
        .connect(owner)
        .grantRole(
          role,
          tokenAddress,
          tokenId,
          grantee.address,
          expirationDate,
          data
        );
      await erc7432
        .connect(owner)
        .grantRole(
          role,
          tokenAddress,
          tokenId,
          anotherGrantee.address,
          expirationDate + 1000,
          data
        );

      const isUnique = await erc7432.hasUniqueRole(
        role,
        tokenAddress,
        tokenId,
        owner.address,
        grantee.address
      );
      expect(isUnique).to.be.false;
    });
  });
});
