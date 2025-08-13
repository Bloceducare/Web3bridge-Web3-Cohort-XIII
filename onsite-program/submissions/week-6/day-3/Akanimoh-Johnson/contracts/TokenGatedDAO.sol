// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./RolesRegistry.sol";

contract TokenGatedDAO is Ownable {
    RolesRegistry public rolesRegistry;
    address public membershipNFT;

    bytes32 public constant VOTER_ROLE = keccak256("VOTER");
    bytes32 public constant PROPOSER_ROLE = keccak256("PROPOSER");

    struct Proposal {
        address proposer;
        string description;
        uint256 yesVotes;
        uint256 noVotes;
        bool executed;
        uint256 deadline;
        mapping(address => bool) hasVoted;
    }

    mapping(uint256 => Proposal) public proposals;
    uint256 public proposalCount;

    event ProposalCreated(uint256 indexed proposalId, address proposer, string description, uint256 deadline);
    event Voted(uint256 indexed proposalId, address voter, bool vote);
    event ProposalExecuted(uint256 indexed proposalId);

    constructor(address _membershipNFT, address _rolesRegistry) Ownable(msg.sender) {
        membershipNFT = _membershipNFT;
        rolesRegistry = RolesRegistry(_rolesRegistry);
    }

    function createProposal(string calldata description, uint256 duration) 
        external returns (uint256) {
        require(hasRole(msg.sender, PROPOSER_ROLE), "Not authorized to propose");
        
        uint256 proposalId = proposalCount++;
        Proposal storage proposal = proposals[proposalId];
        proposal.proposer = msg.sender;
        proposal.description = description;
        proposal.deadline = block.timestamp + duration;
        
        emit ProposalCreated(proposalId, msg.sender, description, proposal.deadline);
        return proposalId;
    }

    function vote(uint256 proposalId, bool support) external {
        Proposal storage proposal = proposals[proposalId];
        require(block.timestamp <= proposal.deadline, "Voting period ended");
        require(!proposal.hasVoted[msg.sender], "Already voted");
        require(hasRole(msg.sender, VOTER_ROLE), "Not authorized to vote");

        proposal.hasVoted[msg.sender] = true;
        if (support) {
            proposal.yesVotes++;
        } else {
            proposal.noVotes++;
        }

        emit Voted(proposalId, msg.sender, support);
    }

    function executeProposal(uint256 proposalId) external onlyOwner {
        Proposal storage proposal = proposals[proposalId];
        require(block.timestamp > proposal.deadline, "Voting period not ended");
        require(!proposal.executed, "Already executed");

        require(proposal.yesVotes > proposal.noVotes, "Proposal not approved");

        proposal.executed = true;
        emit ProposalExecuted(proposalId);
        
    }

    function hasRole(address account, bytes32 roleId) public view returns (bool) {
        uint256[] memory tokenIds = getUserTokens(account);
        for (uint256 i = 0; i < tokenIds.length; i++) {
            if (rolesRegistry.hasValidRole(membershipNFT, tokenIds[i], roleId)) {
                return true;
            }
        }
        return false;
    }

    function getUserTokens(address user) private view returns (uint256[] memory) {
        uint256 balance = IERC721(membershipNFT).balanceOf(user);
        uint256[] memory tokenIds = new uint256[](balance);
        for (uint256 i = 0; i < balance; i++) {
            tokenIds[i] = i; 
        }
        return tokenIds;
    }
}