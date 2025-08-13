// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

interface IMembershipNFT {
    function ownerOf(uint256 tokenId) external view returns (address);
    function balanceOf(address owner) external view returns (uint256);
    function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256);
}

interface IRolesRegistry7432 {
    // Updated to match your registry's expected signature
    function hasRole(address tokenAddress, uint256 tokenId, bytes32 role) external view returns (bool);
}

contract DAO {
    struct Proposal {
        string description;
        uint256 yesVotes;
        uint256 noVotes;
        bool executed;
    }

    IMembershipNFT public membershipNFT;
    IRolesRegistry7432 public rolesRegistry;
    mapping(uint256 => Proposal) public proposals;
    uint256 public proposalCount;

    bytes32 public constant ROLE_VOTER = keccak256("VOTER");

    constructor(address _membershipNFT, address _rolesRegistry) {
        membershipNFT = IMembershipNFT(_membershipNFT);
        rolesRegistry = IRolesRegistry7432(_rolesRegistry);
    }

    // function hasVotingRights(address user, uint256 tokenId) public view returns (bool) {
    //     // Now passing the membership NFT contract address
    //     return rolesRegistry.hasRole(address(membershipNFT), tokenId, ROLE_VOTER);
    // }

    function hasVotingRights(address user) public view returns (bool) {
        uint256 balance = membershipNFT.balanceOf(user);
        for (uint256 i = 0; i < balance; i++) {
            uint256 tokenId = membershipNFT.tokenOfOwnerByIndex(user, i);
            // Updated to pass the token contract address
            if (rolesRegistry.hasRole(address(membershipNFT), tokenId, ROLE_VOTER)) {
                return true;
            }
        }
        return false;
    }

    function createProposal(string memory description) external {
        require(hasVotingRights(msg.sender), "Not authorized to create proposal");
        proposalCount++;
        proposals[proposalCount] = Proposal(description, 0, 0, false);
    }

    function vote(uint256 proposalId, bool support) external {
        require(hasVotingRights(msg.sender), "Not authorized to vote");
        Proposal storage proposal = proposals[proposalId];
        require(!proposal.executed, "Already executed");

        if (support) {
            proposal.yesVotes++;
        } else {
            proposal.noVotes++;
        }
    }

    function getProposal(uint256 proposalId) external view returns (Proposal memory) {
        return proposals[proposalId];
    }
}