import { expect } from "chai";
import { ethers } from "hardhat";
import { DAOMemberNFT, TokenGatedDAO } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("TokenGatedDAO", function () {
    let nft: DAOMemberNFT;
    let dao: TokenGatedDAO;
    let owner: SignerWithAddress;
    let user1: SignerWithAddress;
    let user2: SignerWithAddress;
    
    const VOTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("VOTER"));
    const PROPOSER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("PROPOSER"));
    const ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ADMIN"));
    
    beforeEach(async function () {
        [owner, user1, user2] = await ethers.getSigners();
        
        const DAOMemberNFT = await ethers.getContractFactory("DAOMemberNFT");
        nft = await DAOMemberNFT.deploy();
        
        const TokenGatedDAO = await ethers.getContractFactory("TokenGatedDAO");
        dao = await TokenGatedDAO.deploy(await nft.getAddress());
        
        await nft.mint(user1.address, 1);
        await nft.connect(user1).grantRole(1, VOTER_ROLE, user1.address, 0);
        await nft.connect(user1).grantRole(1, PROPOSER_ROLE, user1.address, 0);
        await nft.connect(user1).grantRole(1, ADMIN_ROLE, user1.address, 0);
    });
    
    describe("Proposal Creation", function () {
        it("Should create proposal with PROPOSER role", async function () {
            await expect(dao.connect(user1).createProposal("Test proposal"))
                .to.emit(dao, "ProposalCreated")
                .withArgs(1, user1.address, "Test proposal");
        });
        
        it("Should reject proposal creation without PROPOSER role", async function () {
            await expect(dao.connect(user2).createProposal("Test proposal"))
                .to.be.revertedWith("Missing required role");
        });
    });
    
    describe("Voting", function () {
        beforeEach(async function () {
            await dao.connect(user1).createProposal("Test proposal");
        });
        
        it("Should allow voting with VOTER role", async function () {
            await expect(dao.connect(user1).vote(1, true))
                .to.emit(dao, "VoteCast")
                .withArgs(1, user1.address, true);
        });
        
        it("Should reject voting without VOTER role", async function () {
            await expect(dao.connect(user2).vote(1, true))
                .to.be.revertedWith("Missing required role");
        });
        
        it("Should prevent double voting", async function () {
            await dao.connect(user1).vote(1, true);
            
            await expect(dao.connect(user1).vote(1, false))
                .to.be.revertedWith("Already voted");
        });
    });
    
    describe("Proposal Execution", function () {
        beforeEach(async function () {
            await dao.connect(user1).createProposal("Test proposal");
            await dao.connect(user1).vote(1, true);
            await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60 + 1]);
            await ethers.provider.send("evm_mine", []);
        });
        
        it("Should execute proposal with ADMIN role", async function () {
            await expect(dao.connect(user1).executeProposal(1))
                .to.emit(dao, "ProposalExecuted")
                .withArgs(1);
        });
        
        it("Should reject execution without ADMIN role", async function () {
            await expect(dao.connect(user2).executeProposal(1))
                .to.be.revertedWith("Missing required role");
        });
    });
});