// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "../src/RolesRegistry.sol";
import "../src/DAONFT.sol";
import "../src/DAO.sol";

contract DAOTest is Test {
    RolesRegistry public rolesRegistry;
    DAONFT public nft;
    DAO public dao;
    
    address public alice = address(0x1);
    address public bob = address(0x2);
    address public carol = address(0x3);
    address public dave = address(0x4);
    
    uint256 public aliceTokenId = 0;
    uint256 public bobTokenId = 1;
    uint256 public carolTokenId = 2;
    uint256 public daveTokenId = 3;
    
    function setUp() public {
        rolesRegistry = new RolesRegistry();
        nft = new DAONFT("Governance", "GOV", address(rolesRegistry));
        dao = new DAO(address(rolesRegistry), address(nft));
        
        nft.mint(alice);
        nft.mint(bob);
        nft.mint(carol);
        nft.mint(dave);
        
        // Grant roles to specific NFTs
        rolesRegistry.grantRole(dao.PROPOSER_ROLE(), alice, aliceTokenId);
        rolesRegistry.grantRole(dao.VOTER_ROLE(), alice, aliceTokenId);
        rolesRegistry.grantRole(dao.VOTER_ROLE(), bob, bobTokenId);
        rolesRegistry.grantRole(dao.VOTER_ROLE(), carol, carolTokenId);
        rolesRegistry.grantRole(dao.EXECUTOR_ROLE(), dave, daveTokenId);
        
        // Register voters
        vm.prank(alice);
        dao.registerAsVoter(aliceTokenId);
        vm.prank(bob);
        dao.registerAsVoter(bobTokenId);
        vm.prank(carol);
        dao.registerAsVoter(carolTokenId);
    }
    
    function testCreateProposal() public {
        vm.prank(alice);
        uint256 proposalId = dao.createProposal("Test proposal", 100, aliceTokenId);
        
        assertEq(proposalId, 0);
        assertEq(dao.proposalCount(), 1);
        
        DAO.ProposalView memory proposal = dao.getProposal(proposalId);
        assertEq(proposal.id, 0);
        assertEq(proposal.proposer, alice);
        assertEq(proposal.proposerTokenId, aliceTokenId);
        assertEq(proposal.description, "Test proposal");
        assertEq(proposal.startBlock, block.number);
        assertEq(proposal.endBlock, block.number + 100);
        assertFalse(proposal.executed);
        assertFalse(proposal.canceled);
    }
    
    function testCreateProposalNotProposer() public {
        vm.prank(bob);
        vm.expectRevert("DAO: NFT does not have proposer role");
        dao.createProposal("Test proposal", 100, bobTokenId);
    }
    
    function testCreateProposalNotOwner() public {
        vm.prank(bob);
        vm.expectRevert("DAO: caller does not own the NFT");
        dao.createProposal("Test proposal", 100, aliceTokenId);
    }
    
    function testVote() public {
        vm.prank(alice);
        uint256 proposalId = dao.createProposal("Test proposal", 100, aliceTokenId);
        
        vm.prank(alice);
        dao.vote(proposalId, true, aliceTokenId);
        
        assertTrue(dao.hasVoted(proposalId, alice));
        
        vm.prank(bob);
        dao.vote(proposalId, false, bobTokenId);
        
        assertTrue(dao.hasVoted(proposalId, bob));
    }
    
    function testVoteNotInSnapshot() public {
        vm.prank(alice);
        uint256 proposalId = dao.createProposal("Test proposal", 100, aliceTokenId);
        
        address newVoter = address(0x5);
        uint256 newVoterTokenId = 4;
        nft.mint(newVoter);
        rolesRegistry.grantRole(dao.VOTER_ROLE(), newVoter, newVoterTokenId);
        
        vm.prank(newVoter);
        vm.expectRevert("DAO: not in voter snapshot");
        dao.vote(proposalId, true, newVoterTokenId);
    }
    
    function testVoteAlreadyVoted() public {
        vm.prank(alice);
        uint256 proposalId = dao.createProposal("Test proposal", 100, aliceTokenId);
        
        vm.prank(alice);
        dao.vote(proposalId, true, aliceTokenId);
        
        vm.prank(alice);
        vm.expectRevert("DAO: already voted");
        dao.vote(proposalId, false, aliceTokenId);
    }
    
    function testVoteVotingNotStarted() public {
        vm.prank(alice);
        uint256 proposalId = dao.createProposal("Test proposal", 100, aliceTokenId);
        
        // Voting starts immediately when proposal is created, so this should succeed
        vm.prank(bob);
        dao.vote(proposalId, true, bobTokenId);
        
        assertTrue(dao.hasVoted(proposalId, bob));
    }
    
    function testVoteVotingEnded() public {
        vm.prank(alice);
        uint256 proposalId = dao.createProposal("Test proposal", 1, aliceTokenId);
        
        vm.roll(block.number + 2);
        
        vm.prank(bob);
        vm.expectRevert("DAO: voting ended");
        dao.vote(proposalId, true, bobTokenId);
    }
    
    function testExecuteProposal() public {
        vm.prank(alice);
        uint256 proposalId = dao.createProposal("Test proposal", 10, aliceTokenId);
        
        vm.prank(alice);
        dao.vote(proposalId, true, aliceTokenId);
        
        vm.prank(bob);
        dao.vote(proposalId, false, bobTokenId);
        
        vm.prank(carol);
        dao.vote(proposalId, true, carolTokenId);
        
        vm.roll(block.number + 11);
        
        vm.prank(dave);
        dao.executeProposal(proposalId, daveTokenId);
        
        DAO.ProposalView memory proposal = dao.getProposal(proposalId);
        assertTrue(proposal.executed);
    }
    
    function testExecuteProposalNotExecutor() public {
        vm.prank(alice);
        uint256 proposalId = dao.createProposal("Test proposal", 10, aliceTokenId);
        
        vm.prank(alice);
        dao.vote(proposalId, true, aliceTokenId);
        
        vm.roll(block.number + 11);
        
        vm.prank(alice);
        vm.expectRevert("DAO: NFT does not have executor role");
        dao.executeProposal(proposalId, aliceTokenId);
    }
    
    function testExecuteProposalVotingNotEnded() public {
        vm.prank(alice);
        uint256 proposalId = dao.createProposal("Test proposal", 10, aliceTokenId);
        
        vm.prank(alice);
        dao.vote(proposalId, true, aliceTokenId);
        
        vm.prank(dave);
        vm.expectRevert("DAO: voting not ended");
        dao.executeProposal(proposalId, daveTokenId);
    }
    
    function testExecuteProposalDidNotPass() public {
        vm.prank(alice);
        uint256 proposalId = dao.createProposal("Test proposal", 10, aliceTokenId);
        
        vm.prank(alice);
        dao.vote(proposalId, false, aliceTokenId);
        
        vm.prank(bob);
        dao.vote(proposalId, false, bobTokenId);
        
        vm.roll(block.number + 11);
        
        vm.prank(dave);
        vm.expectRevert("DAO: proposal did not pass");
        dao.executeProposal(proposalId, daveTokenId);
    }
    
    function testCancelProposal() public {
        vm.prank(alice);
        uint256 proposalId = dao.createProposal("Test proposal", 100, aliceTokenId);
        
        vm.prank(alice);
        dao.cancelProposal(proposalId);
        
        DAO.ProposalView memory proposal = dao.getProposal(proposalId);
        assertFalse(proposal.executed);
        assertTrue(proposal.canceled);
    }
    
    function testCancelProposalNotProposer() public {
        vm.prank(alice);
        uint256 proposalId = dao.createProposal("Test proposal", 100, aliceTokenId);
        
        vm.prank(bob);
        vm.expectRevert("DAO: only proposer can cancel");
        dao.cancelProposal(proposalId);
    }
    
    function testCancelProposalVotingStarted() public {
        vm.prank(alice);
        uint256 proposalId = dao.createProposal("Test proposal", 1, aliceTokenId);
        
        vm.roll(block.number + 1);
        
        vm.prank(alice);
        vm.expectRevert("DAO: voting already started");
        dao.cancelProposal(proposalId);
    }
    
    function testGetVoterSnapshot() public {
        vm.prank(alice);
        uint256 proposalId = dao.createProposal("Test proposal", 100, aliceTokenId);
        
        address[] memory snapshot = dao.getVoterSnapshot(proposalId);
        assertEq(snapshot.length, 3);
        
        bool aliceFound = false;
        bool bobFound = false;
        bool carolFound = false;
        
        for (uint256 i = 0; i < snapshot.length; i++) {
            if (snapshot[i] == alice) aliceFound = true;
            if (snapshot[i] == bob) bobFound = true;
            if (snapshot[i] == carol) carolFound = true;
        }
        
        assertTrue(aliceFound);
        assertTrue(bobFound);
        assertTrue(carolFound);
    }
    
    function testRegisterAsVoter() public {
        address newVoter = address(0x5);
        uint256 newVoterTokenId = 4;
        nft.mint(newVoter);
        rolesRegistry.grantRole(dao.VOTER_ROLE(), newVoter, newVoterTokenId);
        
        assertEq(dao.getEligibleVoterCount(), 3);
        
        vm.prank(newVoter);
        dao.registerAsVoter(newVoterTokenId);
        
        assertEq(dao.getEligibleVoterCount(), 4);
        assertTrue(dao.eligibleVoters(newVoter));
    }
} 