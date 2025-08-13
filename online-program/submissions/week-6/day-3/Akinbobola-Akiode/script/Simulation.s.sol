// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "../src/RolesRegistry.sol";
import "../src/DAONFT.sol";
import "../src/DAO.sol";

contract SimulationScript is Script {
    address constant ROLES_REGISTRY_ADDR = 0x84eA74d481Ee0A5332c457a4d796187F6Ba67fEB;
    address constant DAONFT_ADDR = 0x9E545E3C0baAB3E08CdfD552C960A1050f373042;
    address constant DAO_ADDR = 0xa82fF9aFd8f496c3d6ac40E2a0F282E47488CFc9;
    
    address constant ALICE = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266;
    address constant BOB = 0x70997970C51812dc3A010C7d01b50e0d17dc79C8;
    address constant CAROL = 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC;

    function run() external {
        testNFTFunctionality(DAONFT(DAONFT_ADDR));
        uint256 proposalId = testProposalCreation(DAO(DAO_ADDR));
        testVotingSystem(DAO(DAO_ADDR), proposalId);
        testTimeBasedExecution(DAO(DAO_ADDR), proposalId);
        testSecurityFeatures(DAO(DAO_ADDR));
    }
    
    function testNFTFunctionality(DAONFT daonft) internal {
        daonft.balanceOf(ALICE);
        
        if (daonft.balanceOf(ALICE) > 0) {
            daonft.ownerOf(0);
        }
        
        vm.prank(ALICE);
        daonft.mint(BOB);
        
        daonft.balanceOf(BOB);
        daonft.ownerOf(1);
    }
    
    function testProposalCreation(DAO dao) internal returns (uint256) {
        dao.proposalCount();
        
        vm.prank(ALICE);
        uint256 proposalId = dao.createProposal("Test Proposal: Increase DAO treasury by 100 ETH", 10, 0);
        
        dao.getProposal(proposalId);
        
        vm.prank(ALICE);
        dao.createProposal("Test Proposal: Launch new governance token", 15, 0);
        
        dao.proposalCount();
        
        return proposalId;
    }
    
    function testVotingSystem(DAO dao, uint256 proposalId) internal {
        vm.prank(ALICE);
        dao.vote(proposalId, true, 0);
        
        dao.getProposal(proposalId);
        
        dao.hasVoted(proposalId, ALICE);
        
        vm.prank(ALICE);
        try dao.vote(proposalId, false, 0) {
        } catch {
        }
        
        dao.getProposal(proposalId);
    }
    
    function testTimeBasedExecution(DAO dao, uint256 proposalId) internal {
        uint256 currentBlock = block.number;
        
        DAO.ProposalView memory proposal = dao.getProposal(proposalId);
        
        vm.prank(ALICE);
        try dao.executeProposal(proposalId, 0) {
        } catch {
        }
        
        uint256 blocksToAdvance = proposal.endBlock - currentBlock + 1;
        
        for (uint256 i = 0; i < blocksToAdvance; i++) {
            vm.roll(currentBlock + i + 1);
        }
        
        vm.prank(ALICE);
        try dao.executeProposal(proposalId, 0) {
            dao.getProposal(proposalId);
        } catch {
        }
    }
    
    function testSecurityFeatures(DAO dao) internal {
        vm.prank(ALICE);
        try dao.vote(999, true, 0) {
        } catch {
        }
        
        vm.prank(ALICE);
        try dao.executeProposal(999, 0) {
        } catch {
        }
        
        vm.prank(ALICE);
        uint256 cancelProposalId = dao.createProposal("Proposal to cancel", 100, 0);
        
        vm.prank(ALICE);
        try dao.cancelProposal(cancelProposalId) {
            dao.getProposal(cancelProposalId);
        } catch {
        }
        
        dao.getEligibleVoterCount();
    }
} 