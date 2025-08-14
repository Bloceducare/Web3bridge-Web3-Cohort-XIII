// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "./RoleNFT.sol";

contract CouncilDAO {
    struct Proposal {
        string description;
        uint256 votesFor;
        uint256 votesAgainst;
        bool active;
        bool executed;
    }

    Proposal[] public proposals;
    RoleNFT public roleNFT;

    bytes32 public constant PROPOSER_ROLE = keccak256("PROPOSER");
    bytes32 public constant VOTER_ROLE = keccak256("VOTER");

    uint256 public quorum;

    mapping(uint256 => mapping(address => bool)) public hasVoted;

    event ProposalExecuted(uint256 indexed proposalId, string description, uint256 votesFor, uint256 votesAgainst, bool passed);


    constructor(address roleNFTAddress) {
        roleNFT = RoleNFT(roleNFTAddress);
    }

    function createProposal(uint256 tokenId, string memory description) external {
        require(roleNFT.hasRole(tokenId, PROPOSER_ROLE, msg.sender), "Not authorized to propose");
        proposals.push(Proposal(description, 0, 0, true, false));
    }

    function vote(uint256 tokenId, uint256 proposalId, bool support) external {
        require(roleNFT.hasRole(tokenId, VOTER_ROLE, msg.sender), "Not authorized to vote");
        require(proposals[proposalId].active, "Proposal not active");
        require(proposalId < proposals.length, "Invalid proposal");
        require(!hasVoted[proposalId][msg.sender], "Already voted");

        hasVoted[proposalId][msg.sender] = true;
        
        if (support) {
            proposals[proposalId].votesFor++;
        } else {
            proposals[proposalId].votesAgainst++;
        }
    }

    function closeProposal(uint256 proposalId) external {
        require(proposalId < proposals.length, "Invalid proposal");
        Proposal storage prop = proposals[proposalId];
        require(prop.active, "Already closed");

        prop.active = false;
        prop.executed = true;

        uint256 totalVotes = prop.votesFor + prop.votesAgainst;
        bool passed = false;

        if (totalVotes >= quorum && prop.votesFor > prop.votesAgainst) {
            passed = true;
        }

        emit ProposalExecuted(proposalId, prop.description, prop.votesFor, prop.votesAgainst, passed);
    }

    function getProposal(uint256 proposalId) external view returns (Proposal memory) {
        require(proposalId < proposals.length, "Invalid proposal");
        return proposals[proposalId];
    }
}