// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/MembershipNFT.sol";
import "../contracts/RolesRegistry.sol";
import "../contracts/TokenGatedDAO.sol";
contract TokenGatedDAOTest is Test {
    MembershipNFT membershipNFT;
    RolesRegistry rolesRegistry;
    TokenGatedDAO dao;
    address owner;
    address addr1;
    address addr2;
    bytes32 VOTER_ROLE = keccak256("VOTER");
    bytes32 PROPOSER_ROLE = keccak256("PROPOSER");

    function setUp() public {
        // Set up addresses
        owner = address(this);
        addr1 = address(0x1);
        addr2 = address(0x2);

        // Deploy contracts
        membershipNFT = new MembershipNFT();
        rolesRegistry = new RolesRegistry();
        dao = new TokenGatedDAO(address(membershipNFT), address(rolesRegistry));
    }

    function testRoleBasedProposalCreationAndVoting() public {
        // Mint NFT to addr1
        vm.prank(owner);
        membershipNFT.mint(addr1);

        // Grant VOTER and PROPOSER roles to addr1
        vm.startPrank(addr1);
        rolesRegistry.grantRole(address(membershipNFT), 0, VOTER_ROLE, addr1, 0, true, "");
        rolesRegistry.grantRole(address(membershipNFT), 0, PROPOSER_ROLE, addr1, 0, true, "");
        vm.stopPrank();

        // Create proposal
        uint256 duration = 86400; // 1 day
        vm.prank(addr1);
        uint256 proposalId = dao.createProposal("Test proposal", duration);

        // Vote
        vm.prank(addr1);
        dao.vote(proposalId, true);

        // Fast forward time
        vm.warp(block.timestamp + duration + 1);

        // Execute proposal
        vm.prank(owner);
        dao.executeProposal(proposalId);

        // Verify proposal was executed
        (,,,, bool executed,) = dao.proposals(proposalId); // Fixed destructuring
        assertTrue(executed, "Proposal should be executed");
    }

    function testPreventUnauthorizedProposal() public {
        // Attempt to create proposal with addr2 (no roles)
        vm.prank(addr2);
        vm.expectRevert("Not authorized to propose");
        dao.createProposal("Unauthorized proposal", 86400);
    }
}