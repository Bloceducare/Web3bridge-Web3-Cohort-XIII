// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";

contract DAODAOGovernance is Ownable {
    struct Proposal {
        uint256 id;
        address proposer;
        string description;
        uint256 voteCount;
        uint256 endTime;
        bool executed;
        mapping(address => bool) voters;
    }

    mapping(uint256 => Proposal) public proposals;
    uint256 public proposalCount;
    uint256 public constant VOTING_PERIOD = 7 days;

    // Whitelist addresses for roles
    mapping(address => bool) public canPropose;
    mapping(address => bool) public canVote;
    mapping(address => bool) public canExecute;

    event ProposalCreated(uint256 indexed proposalId, address proposer, string description);
    event Voted(uint256 indexed proposalId, address voter, bool support);
    event ProposalExecuted(uint256 indexed proposalId);

    constructor() Ownable(msg.sender) {}

    // Owner can grant roles
    function grantRole(string memory role, address account) public onlyOwner {
        if (keccak256(abi.encodePacked(role)) == keccak256(abi.encodePacked("CAN_PROPOSE"))) {
            canPropose[account] = true;
        } else if (keccak256(abi.encodePacked(role)) == keccak256(abi.encodePacked("CAN_VOTE"))) {
            canVote[account] = true;
        } else if (keccak256(abi.encodePacked(role)) == keccak256(abi.encodePacked("CAN_EXECUTE"))) {
            canExecute[account] = true;
        }
    }

    // Revoke role
    function revokeRole(string memory role, address account) public onlyOwner {
        if (keccak256(abi.encodePacked(role)) == keccak256(abi.encodePacked("CAN_PROPOSE"))) {
            canPropose[account] = false;
        } else if (keccak256(abi.encodePacked(role)) == keccak256(abi.encodePacked("CAN_VOTE"))) {
            canVote[account] = false;
        } else if (keccak256(abi.encodePacked(role)) == keccak256(abi.encodePacked("CAN_EXECUTE"))) {
            canExecute[account] = false;
        }
    }

    function createProposal(string memory description) public {
        require(canPropose[msg.sender], "No propose permission");

        proposalCount++;
        Proposal storage newProposal = proposals[proposalCount];
        newProposal.id = proposalCount;
        newProposal.proposer = msg.sender;
        newProposal.description = description;
        newProposal.endTime = block.timestamp + VOTING_PERIOD;
        newProposal.executed = false;

        emit ProposalCreated(proposalCount, msg.sender, description);
    }

    function vote(uint256 proposalId, bool support) public {
        require(canVote[msg.sender], "No vote permission");
        Proposal storage proposal = proposals[proposalId];
        require(block.timestamp <= proposal.endTime, "Voting period ended");
        require(!proposal.voters[msg.sender], "Already voted");

        proposal.voters[msg.sender] = true;
        if (support) {
            proposal.voteCount++;
        }

        emit Voted(proposalId, msg.sender, support);
    }

    function executeProposal(uint256 proposalId) public {
        require(canExecute[msg.sender], "No execute permission");
        Proposal storage proposal = proposals[proposalId];
        require(block.timestamp > proposal.endTime, "Voting period not ended");
        require(!proposal.executed, "Proposal already executed");

        proposal.executed = true;

        emit ProposalExecuted(proposalId);
    }
}