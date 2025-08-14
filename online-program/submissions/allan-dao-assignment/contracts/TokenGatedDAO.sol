// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./IERC7432.sol";

contract TokenGatedDAO {
    struct Proposal {
        uint256 id;
        string description;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 deadline;
        bool executed;
        mapping(address => bool) hasVoted;
    }

    IERC7432 public immutable roleNFT;
    bytes32 public constant VOTER_ROLE = keccak256("VOTER_ROLE");
    bytes32 public constant PROPOSER_ROLE = keccak256("PROPOSER_ROLE");
    bytes32 public constant EXECUTOR_ROLE = keccak256("EXECUTOR_ROLE");

    mapping(uint256 => Proposal) public proposals;
    uint256 public proposalCount;
    uint256 public constant VOTING_PERIOD = 7 days;

    event ProposalCreated(uint256 indexed proposalId, string description, uint256 deadline);
    event VoteCast(uint256 indexed proposalId, address indexed voter, bool support);
    event ProposalExecuted(uint256 indexed proposalId);

    modifier onlyRoleHolder(bytes32 role) {
        require(hasValidRole(msg.sender, role), "Insufficient role permissions");
        _;
    }

    constructor(address _roleNFT) {
        roleNFT = IERC7432(_roleNFT);
    }

    function hasValidRole(address account, bytes32 role) public view returns (bool) {
        // Check roles across reasonable token range
        for (uint256 tokenId = 0; tokenId < 100; tokenId++) {
            try roleNFT.hasRole(role, tokenId, account) returns (bool hasRole) {
                if (hasRole) {
                    return true;
                }
            } catch {
                // Token doesn't exist, continue
                continue;
            }
        }
        return false;
    }

    function createProposal(string memory description) external onlyRoleHolder(PROPOSER_ROLE) returns (uint256) {
        uint256 proposalId = proposalCount++;
        Proposal storage proposal = proposals[proposalId];
        proposal.id = proposalId;
        proposal.description = description;
        proposal.deadline = block.timestamp + VOTING_PERIOD;
        
        emit ProposalCreated(proposalId, description, proposal.deadline);
        return proposalId;
    }

    function vote(uint256 proposalId, bool support) external onlyRoleHolder(VOTER_ROLE) {
        Proposal storage proposal = proposals[proposalId];
        require(block.timestamp < proposal.deadline, "Voting period ended");
        require(!proposal.hasVoted[msg.sender], "Already voted");
        
        proposal.hasVoted[msg.sender] = true;
        
        if (support) {
            proposal.forVotes++;
        } else {
            proposal.againstVotes++;
        }
        
        emit VoteCast(proposalId, msg.sender, support);
    }

    function executeProposal(uint256 proposalId) external onlyRoleHolder(EXECUTOR_ROLE) {
        Proposal storage proposal = proposals[proposalId];
        require(block.timestamp >= proposal.deadline, "Voting still active");
        require(!proposal.executed, "Already executed");
        require(proposal.forVotes > proposal.againstVotes, "Proposal rejected");
        
        proposal.executed = true;
        emit ProposalExecuted(proposalId);
    }

    function getProposal(uint256 proposalId) external view returns (
        uint256 id,
        string memory description,
        uint256 forVotes,
        uint256 againstVotes,
        uint256 deadline,
        bool executed
    ) {
        Proposal storage proposal = proposals[proposalId];
        return (
            proposal.id,
            proposal.description,
            proposal.forVotes,
            proposal.againstVotes,
            proposal.deadline,
            proposal.executed
        );
    }
}