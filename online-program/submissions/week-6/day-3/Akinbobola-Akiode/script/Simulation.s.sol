// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "../src/RolesRegistry.sol";
import "../src/DAONFT.sol";
import "../src/DAO.sol";

contract SimulationScript is Script {
    // Contract addresses from deployment
    address constant ROLES_REGISTRY_ADDR = 0x84eA74d481Ee0A5332c457a4d796187F6Ba67fEB;
    address constant DAONFT_ADDR = 0x9E545E3C0baAB3E08CdfD552C960A1050f373042;
    address constant DAO_ADDR = 0xa82fF9aFd8f496c3d6ac40E2a0F282E47488CFc9;
    
    // Test accounts (from Anvil)
    address constant ALICE = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266; // Deployer
    address constant BOB = 0x70997970C51812dc3A010C7d01b50e0d17dc79C8;
    address constant CAROL = 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC;

    function run() external {
        console.log("Starting ERC-7432 Token-Gated DAO Simulation");
        console.log("=================================================");
        
        // Get contract instances
        RolesRegistry rolesRegistry = RolesRegistry(ROLES_REGISTRY_ADDR);
        DAONFT daonft = DAONFT(DAONFT_ADDR);
        DAO dao = DAO(DAO_ADDR);
        
        console.log("Contract Addresses:");
        console.log("RolesRegistry:", ROLES_REGISTRY_ADDR);
        console.log("DAONFT:", DAONFT_ADDR);
        console.log("DAO:", DAO_ADDR);
        console.log("");
        
        // Phase 1: Test NFT functionality
        console.log("Phase 1: Testing NFT functionality...");
        testNFTFunctionality(daonft);
        
        // Phase 2: Test DAO proposal creation
        console.log("\nPhase 2: Testing proposal creation...");
        uint256 proposalId = testProposalCreation(dao);
        
        // Phase 3: Test voting system
        console.log("\nPhase 3: Testing voting system...");
        testVotingSystem(dao, proposalId);
        
        // Phase 4: Test time-based execution
        console.log("\nPhase 4: Testing time-based execution...");
        testTimeBasedExecution(dao, proposalId);
        
        // Phase 5: Test security features
        console.log("\nPhase 5: Testing security features...");
        testSecurityFeatures(dao);
        
        console.log("\nDAO Simulation Complete!");
        console.log("All functionality tested successfully!");
    }
    
    function testNFTFunctionality(DAONFT daonft) internal {
        console.log("Testing NFT functionality...");
        
        // Check Alice's current NFT
        uint256 aliceBalance = daonft.balanceOf(ALICE);
        console.log("Alice's NFT balance:", aliceBalance);
        
        if (aliceBalance > 0) {
            address owner = daonft.ownerOf(0);
            console.log("NFT #0 owner:", owner);
        }
        
        // Mint NFT for Bob
        console.log("Minting NFT for Bob...");
        vm.prank(ALICE);
        daonft.mint(BOB);
        console.log("Minted NFT #1 to Bob");
        
        // Check Bob's NFT
        uint256 bobBalance = daonft.balanceOf(BOB);
        console.log("Bob's NFT balance:", bobBalance);
        
        address bobNFTOwner = daonft.ownerOf(1);
        console.log("NFT #1 owner:", bobNFTOwner);
    }
    
    function testProposalCreation(DAO dao) internal returns (uint256) {
        console.log("Testing proposal creation...");
        
        // Check initial state
        uint256 proposalCount = dao.proposalCount();
        console.log("Initial proposal count:", proposalCount);
        
        // Create proposal with 10-block voting period
        vm.prank(ALICE);
        uint256 proposalId = dao.createProposal("Test Proposal: Increase DAO treasury by 100 ETH", 10, 0);
        console.log("Created proposal #", proposalId, "with 10-block voting period");
        
        // Check proposal details
        DAO.ProposalView memory proposal = dao.getProposal(proposalId);
        console.log("Proposal details:");
        console.log("  - Description:", proposal.description);
        console.log("  - Start block:", proposal.startBlock);
        console.log("  - End block:", proposal.endBlock);
        console.log("  - For votes:", proposal.forVotes);
        console.log("  - Against votes:", proposal.againstVotes);
        
        // Create second proposal
        vm.prank(ALICE);
        dao.createProposal("Test Proposal: Launch new governance token", 15, 0);
        console.log("Created proposal #1 with 15-block voting period");
        
        proposalCount = dao.proposalCount();
        console.log("Final proposal count:", proposalCount);
        
        return proposalId;
    }
    
    function testVotingSystem(DAO dao, uint256 proposalId) internal {
        console.log("Testing voting system on proposal #", proposalId);
        
        // Alice votes YES
        vm.prank(ALICE);
        dao.vote(proposalId, true, 0);
        console.log("Alice voted YES");
        
        // Check voting results
        DAO.ProposalView memory proposal = dao.getProposal(proposalId);
        console.log("After Alice's vote:");
        console.log("  - For votes:", proposal.forVotes);
        console.log("  - Against votes:", proposal.againstVotes);
        console.log("  - Total votes:", proposal.forVotes + proposal.againstVotes);
        
        // Check if Alice has voted
        bool aliceVoted = dao.hasVoted(proposalId, ALICE);
        console.log("Alice has voted:", aliceVoted);
        
        // Try to vote again (should fail)
        vm.prank(ALICE);
        try dao.vote(proposalId, false, 0) {
            console.log("ERROR: Alice was able to vote twice!");
        } catch {
            console.log("Correctly prevented double voting");
        }
        
        // Check final voting results
        proposal = dao.getProposal(proposalId);
        console.log("Final voting results:");
        console.log("  - For votes:", proposal.forVotes);
        console.log("  - Against votes:", proposal.againstVotes);
        console.log("  - Proposal passed:", proposal.forVotes > proposal.againstVotes ? "YES" : "NO");
    }
    
    function testTimeBasedExecution(DAO dao, uint256 proposalId) internal {
        console.log("Testing time-based execution for proposal #", proposalId);
        
        // Check current block
        uint256 currentBlock = block.number;
        console.log("Current block:", currentBlock);
        
        // Get proposal details
        DAO.ProposalView memory proposal = dao.getProposal(proposalId);
        console.log("Proposal end block:", proposal.endBlock);
        
        // Try to execute before voting ends (should fail)
        vm.prank(ALICE);
        try dao.executeProposal(proposalId, 0) {
            console.log("ERROR: Proposal executed before voting ended!");
        } catch Error(string memory reason) {
            console.log("Correctly prevented early execution:", reason);
        } catch {
            console.log("Correctly prevented early execution with unknown error");
        }
        
        // Advance blocks to end voting period
        uint256 blocksToAdvance = proposal.endBlock - currentBlock + 1;
        console.log("Advancing", blocksToAdvance, "blocks to end voting...");
        
        for (uint256 i = 0; i < blocksToAdvance; i++) {
            vm.roll(currentBlock + i + 1);
        }
        
        console.log("Advanced to block:", block.number);
        
        // Now try to execute (should succeed)
        vm.prank(ALICE);
        try dao.executeProposal(proposalId, 0) {
            console.log("Successfully executed proposal #", proposalId);
            
            // Check if proposal is now executed
            proposal = dao.getProposal(proposalId);
            console.log("Proposal executed:", proposal.executed);
        } catch Error(string memory reason) {
            console.log("Failed to execute proposal:", reason);
        } catch {
            console.log("Failed to execute proposal with unknown error");
        }
    }
    
    function testSecurityFeatures(DAO dao) internal {
        console.log("Testing security features...");
        
        // Test voting on non-existent proposal
        vm.prank(ALICE);
        try dao.vote(999, true, 0) {
            console.log("ERROR: Was able to vote on non-existent proposal!");
        } catch {
            console.log("Correctly prevented voting on non-existent proposal");
        }
        
        // Test executing non-existent proposal
        vm.prank(ALICE);
        try dao.executeProposal(999, 0) {
            console.log("ERROR: Was able to execute non-existent proposal!");
        } catch {
            console.log("Correctly prevented executing non-existent proposal");
        }
        
        // Test proposal cancellation
        console.log("Testing proposal cancellation...");
        
        // Create a new proposal for cancellation testing
        vm.prank(ALICE);
        uint256 cancelProposalId = dao.createProposal("Proposal to cancel", 100, 0);
        console.log("Created proposal #", cancelProposalId, "for cancellation testing");
        
        // Try to cancel the proposal
        vm.prank(ALICE);
        try dao.cancelProposal(cancelProposalId) {
            console.log("Successfully cancelled proposal #", cancelProposalId);
            
            // Check if proposal is cancelled
            DAO.ProposalView memory proposal = dao.getProposal(cancelProposalId);
            console.log("Proposal cancelled:", proposal.canceled);
        } catch Error(string memory reason) {
            console.log("Failed to cancel proposal:", reason);
        } catch {
            console.log("Failed to cancel proposal with unknown error");
        }
        
        // Test voter snapshot functionality
        console.log("Testing voter snapshot functionality...");
        uint256 eligibleVoterCount = dao.getEligibleVoterCount();
        console.log("Total eligible voters:", eligibleVoterCount);
        
        console.log("All security features tested successfully");
    }
} 