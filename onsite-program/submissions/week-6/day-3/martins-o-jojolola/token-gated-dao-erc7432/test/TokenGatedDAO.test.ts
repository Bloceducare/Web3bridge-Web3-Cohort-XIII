import { loadFixture, time } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("Token-Gated DAO with ERC-7432", function () {
    async function deployTokenGatedDAOFixture() {
        const [owner, user1, user2, user3] = await ethers.getSigners();

        const RoleBasedNFT = await ethers.getContractFactory("RoleBasedNFT");
        const roleBasedNFT = await RoleBasedNFT.deploy("DAO Membership NFT", "DAONFT");
        await roleBasedNFT.waitForDeployment();

        const TokenGatedDAO = await ethers.getContractFactory("TokenGatedDAO");
        const tokenGatedDAO = await TokenGatedDAO.deploy(await roleBasedNFT.getAddress());
        await tokenGatedDAO.waitForDeployment();

        const DAO_MEMBER_ROLE = await roleBasedNFT.DAO_MEMBER_ROLE();
        const DAO_ADMIN_ROLE = await roleBasedNFT.DAO_ADMIN_ROLE();
        const PROPOSAL_CREATOR_ROLE = await roleBasedNFT.PROPOSAL_CREATOR_ROLE();
        const VOTER_ROLE = await roleBasedNFT.VOTER_ROLE();

        return {
            roleBasedNFT,
            tokenGatedDAO,
            owner,
            user1,
            user2,
            user3,
            DAO_MEMBER_ROLE,
            DAO_ADMIN_ROLE,
            PROPOSAL_CREATOR_ROLE,
            VOTER_ROLE
        };
    }

    describe("RoleBasedNFT", function () {
        describe("Deployment", function () {
            it("Should set the correct name and symbol", async function () {
                const {roleBasedNFT} = await loadFixture(deployTokenGatedDAOFixture);

                expect(await roleBasedNFT.name()).to.equal("DAO Membership NFT");
                expect(await roleBasedNFT.symbol()).to.equal("DAONFT");
            });

            it("Should set the correct role constants", async function () {
                const {roleBasedNFT} = await loadFixture(deployTokenGatedDAOFixture);

                expect(await roleBasedNFT.DAO_MEMBER_ROLE()).to.equal(ethers.keccak256(ethers.toUtf8Bytes("DAO_MEMBER")));
                expect(await roleBasedNFT.DAO_ADMIN_ROLE()).to.equal(ethers.keccak256(ethers.toUtf8Bytes("DAO_ADMIN")));
                expect(await roleBasedNFT.PROPOSAL_CREATOR_ROLE()).to.equal(ethers.keccak256(ethers.toUtf8Bytes("PROPOSAL_CREATOR")));
                expect(await roleBasedNFT.VOTER_ROLE()).to.equal(ethers.keccak256(ethers.toUtf8Bytes("VOTER")));
            });
        });

        describe("Minting", function () {
            it("Should allow owner to mint NFTs", async function () {
                const {roleBasedNFT, user1} = await loadFixture(deployTokenGatedDAOFixture);

                await expect(roleBasedNFT.mint(user1.address))
                    .to.not.be.reverted;

                expect(await roleBasedNFT.ownerOf(0)).to.equal(user1.address);
                expect(await roleBasedNFT.totalSupply()).to.equal(1);
            });

            it("Should not allow non-owner to mint NFTs", async function () {
                const {roleBasedNFT, user1} = await loadFixture(deployTokenGatedDAOFixture);

                await expect(roleBasedNFT.connect(user1).mint(user1.address))
                    .to.be.revertedWithCustomError(roleBasedNFT, "OwnableUnauthorizedAccount");
            });
        });

        describe("Role Management", function () {
            it("Should allow NFT owner to grant roles", async function () {
                const {roleBasedNFT, user1, user2, DAO_MEMBER_ROLE} = await loadFixture(deployTokenGatedDAOFixture);

                await roleBasedNFT.mint(user1.address);
                const tokenId = 0;

                await expect(roleBasedNFT.connect(user1).grantRole(
                    DAO_MEMBER_ROLE,
                    tokenId,
                    user2.address,
                    0,
                    true,
                    "0x"
                )).to.emit(roleBasedNFT, "RoleGranted")
                    .withArgs(DAO_MEMBER_ROLE, tokenId, user2.address, 0, true, "0x");

                expect(await roleBasedNFT.hasRole(DAO_MEMBER_ROLE, tokenId, user2.address)).to.be.true;
            });

            it("Should allow contract owner to grant roles", async function () {
                const {
                    roleBasedNFT,
                    owner,
                    user1,
                    user2,
                    DAO_MEMBER_ROLE
                } = await loadFixture(deployTokenGatedDAOFixture);

                await roleBasedNFT.mint(user1.address);
                const tokenId = 0;

                await expect(roleBasedNFT.connect(owner).grantRole(
                    DAO_MEMBER_ROLE,
                    tokenId,
                    user2.address,
                    0,
                    true,
                    "0x"
                )).to.not.be.reverted;

                expect(await roleBasedNFT.hasRole(DAO_MEMBER_ROLE, tokenId, user2.address)).to.be.true;
            });

            it("Should not allow unauthorized users to grant roles", async function () {
                const {
                    roleBasedNFT,
                    user1,
                    user2,
                    user3,
                    DAO_MEMBER_ROLE
                } = await loadFixture(deployTokenGatedDAOFixture);

                await roleBasedNFT.mint(user1.address);
                const tokenId = 0;

                await expect(roleBasedNFT.connect(user3).grantRole(
                    DAO_MEMBER_ROLE,
                    tokenId,
                    user2.address,
                    0,
                    true,
                    "0x"
                )).to.be.revertedWith("RoleBasedNFT: Not authorized to grant role");
            });

            it("Should handle role expiration correctly", async function () {
                const {roleBasedNFT, user1, user2, DAO_MEMBER_ROLE} = await loadFixture(deployTokenGatedDAOFixture);

                await roleBasedNFT.mint(user1.address);
                const tokenId = 0;

                const expirationDate = (await time.latest()) + 3600;
                await roleBasedNFT.connect(user1).grantRole(
                    DAO_MEMBER_ROLE,
                    tokenId,
                    user2.address,
                    expirationDate,
                    true,
                    "0x"
                );

                expect(await roleBasedNFT.hasRole(DAO_MEMBER_ROLE, tokenId, user2.address)).to.be.true;

                await time.increaseTo(expirationDate + 1);

                expect(await roleBasedNFT.hasRole(DAO_MEMBER_ROLE, tokenId, user2.address)).to.be.false;
            });

            it("Should allow revoking revocable roles", async function () {
                const {roleBasedNFT, user1, user2, DAO_MEMBER_ROLE} = await loadFixture(deployTokenGatedDAOFixture);

                await roleBasedNFT.mint(user1.address);
                const tokenId = 0;

                await roleBasedNFT.connect(user1).grantRole(
                    DAO_MEMBER_ROLE,
                    tokenId,
                    user2.address,
                    0,
                    true,
                    "0x"
                );

                await expect(roleBasedNFT.connect(user1).revokeRole(
                    DAO_MEMBER_ROLE,
                    tokenId,
                    user2.address
                )).to.emit(roleBasedNFT, "RoleRevoked")
                    .withArgs(DAO_MEMBER_ROLE, tokenId, user2.address);

                expect(await roleBasedNFT.hasRole(DAO_MEMBER_ROLE, tokenId, user2.address)).to.be.false;
            });

            it("Should not allow revoking non-revocable roles", async function () {
                const {roleBasedNFT, user1, user2, DAO_MEMBER_ROLE} = await loadFixture(deployTokenGatedDAOFixture);

                await roleBasedNFT.mint(user1.address);
                const tokenId = 0;

                await roleBasedNFT.connect(user1).grantRole(
                    DAO_MEMBER_ROLE,
                    tokenId,
                    user2.address,
                    0,
                    false,
                    "0x"
                );

                await expect(roleBasedNFT.connect(user1).revokeRole(
                    DAO_MEMBER_ROLE,
                    tokenId,
                    user2.address
                )).to.be.revertedWith("RoleBasedNFT: Role not revocable");
            });
        });
    });

    describe("TokenGatedDAO", function () {
        describe("Role Checking", function () {
            it("Should correctly identify DAO members", async function () {
                const {
                    roleBasedNFT,
                    tokenGatedDAO,
                    user1,
                    user2,
                    DAO_MEMBER_ROLE
                } = await loadFixture(deployTokenGatedDAOFixture);

                expect(await tokenGatedDAO.isMember(user2.address)).to.be.false;

                await roleBasedNFT.mint(user1.address);
                await roleBasedNFT.connect(user1).grantRole(
                    DAO_MEMBER_ROLE,
                    0,
                    user2.address,
                    0,
                    true,
                    "0x"
                );

                expect(await tokenGatedDAO.isMember(user2.address)).to.be.true;
            });

            it("Should correctly calculate voting power", async function () {
                const {
                    roleBasedNFT,
                    tokenGatedDAO,
                    owner,
                    user1,
                    VOTER_ROLE
                } = await loadFixture(deployTokenGatedDAOFixture);

                expect(await tokenGatedDAO.getVotingPower(user1.address)).to.equal(0);

                await roleBasedNFT.mint(owner.address);
                await roleBasedNFT.mint(owner.address);

                await roleBasedNFT.grantRole(VOTER_ROLE, 0, user1.address, 0, true, "0x");
                await roleBasedNFT.grantRole(VOTER_ROLE, 1, user1.address, 0, true, "0x");

                expect(await tokenGatedDAO.getVotingPower(user1.address)).to.equal(2);
            });
        });

        describe("Proposal Creation", function () {
            it("Should allow authorized users to create proposals", async function () {
                const {
                    roleBasedNFT,
                    tokenGatedDAO,
                    user1,
                    PROPOSAL_CREATOR_ROLE,
                    VOTER_ROLE
                } = await loadFixture(deployTokenGatedDAOFixture);

                await roleBasedNFT.mint(user1.address);
                await roleBasedNFT.connect(user1).grantRole(PROPOSAL_CREATOR_ROLE, 0, user1.address, 0, true, "0x");
                await roleBasedNFT.connect(user1).grantRole(VOTER_ROLE, 0, user1.address, 0, true, "0x");

                const title = "Test Proposal";
                const description = "This is a test proposal";

                const currentTime = await time.latest();

                await expect(tokenGatedDAO.connect(user1).propose(title, description))
                    .to.emit(tokenGatedDAO, "ProposalCreated");

                const proposal = await tokenGatedDAO.getProposal(0);
                expect(proposal.title).to.equal(title);
                expect(proposal.description).to.equal(description);
                expect(proposal.proposer).to.equal(user1.address);
            });

            it("Should not allow unauthorized users to create proposals", async function () {
                const {tokenGatedDAO, user1} = await loadFixture(deployTokenGatedDAOFixture);

                await expect(tokenGatedDAO.connect(user1).propose("Test", "Test proposal"))
                    .to.be.revertedWith("TokenGatedDAO: Not authorized to create proposals");
            });
        });

        describe("Voting", function () {
            it("Should allow authorized users to vote", async function () {
                const {
                    roleBasedNFT,
                    tokenGatedDAO,
                    user1,
                    user2,
                    PROPOSAL_CREATOR_ROLE,
                    VOTER_ROLE
                } = await loadFixture(deployTokenGatedDAOFixture);

                await roleBasedNFT.mint(user1.address);
                await roleBasedNFT.mint(user2.address);

                await roleBasedNFT.connect(user1).grantRole(PROPOSAL_CREATOR_ROLE, 0, user1.address, 0, true, "0x");
                await roleBasedNFT.connect(user1).grantRole(VOTER_ROLE, 0, user1.address, 0, true, "0x");
                await roleBasedNFT.connect(user2).grantRole(VOTER_ROLE, 1, user2.address, 0, true, "0x");

                await tokenGatedDAO.connect(user1).propose("Test Proposal", "Test description");

                await time.increase(86401);

                await expect(tokenGatedDAO.connect(user2).castVote(0, 1, "I support this"))
                    .to.emit(tokenGatedDAO, "VoteCast")
                    .withArgs(user2.address, 0, 1, 1, "I support this");

                const proposal = await tokenGatedDAO.getProposal(0);
                expect(proposal.forVotes).to.equal(1);
            });

            it("Should prevent double voting", async function () {
                const {
                    roleBasedNFT,
                    tokenGatedDAO,
                    user1,
                    PROPOSAL_CREATOR_ROLE,
                    VOTER_ROLE
                } = await loadFixture(deployTokenGatedDAOFixture);

                await roleBasedNFT.mint(user1.address);
                await roleBasedNFT.connect(user1).grantRole(PROPOSAL_CREATOR_ROLE, 0, user1.address, 0, true, "0x");
                await roleBasedNFT.connect(user1).grantRole(VOTER_ROLE, 0, user1.address, 0, true, "0x");

                await tokenGatedDAO.connect(user1).propose("Test Proposal", "Test description");
                await time.increase(86401);

                await tokenGatedDAO.connect(user1).castVote(0, 1, "First vote");

                await expect(tokenGatedDAO.connect(user1).castVote(0, 0, "Second vote"))
                    .to.be.revertedWith("TokenGatedDAO: Already voted");
            });
        });
    });
});