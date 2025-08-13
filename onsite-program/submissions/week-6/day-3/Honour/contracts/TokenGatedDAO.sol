// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC7432} from "./Interface/IERC7432.sol";

/// @title Token-Gated DAO using ERC-7432 roles (Simplified)
/// @notice Permissions are granted if the caller holds the required role on a specific NFT (tokenAddress, tokenId) in an ERC-7432 registry.
contract TokenGatedDAO {
    bytes32 public constant PROPOSER_ROLE = keccak256("DAO_PROPOSER()");
    bytes32 public constant VOTER_ROLE    = keccak256("DAO_VOTER()");
    bytes32 public constant EXECUTOR_ROLE = keccak256("DAO_EXECUTOR()");

    IERC7432 public immutable rolesRegistry;
    uint256 public votingPeriod = 3 days;
    uint256 public quorum = 1;

    struct Proposal {
        uint256 id;
        address proposer;
        string description;
        uint256 deadline;
        uint256 forVotes;
        uint256 againstVotes;
        bool executed;
        bool canceled;
    }

    mapping(uint256 => Proposal) public proposals;
    uint256 public nextProposalId = 1;
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    event ProposalCreated(uint256 indexed id, address indexed proposer, string description, uint256 deadline);
    event VoteCast(uint256 indexed id, address indexed voter, bool support, uint256 weight);
    event ProposalExecuted(uint256 indexed id);
    event ProposalCanceled(uint256 indexed id);

    constructor(IERC7432 _registry) {
        rolesRegistry = _registry;
    }

    function _hasActiveRole(address account, address token, uint256 tokenId, bytes32 roleId) internal view returns (bool) {
        if (rolesRegistry.recipientOf(token, tokenId, roleId) != account) return false;
        uint64 exp = rolesRegistry.roleExpirationDate(token, tokenId, roleId);
        return exp == type(uint64).max || exp >= block.timestamp;
    }

    modifier onlyProposer(address token, uint256 tokenId) {
        require(_hasActiveRole(msg.sender, token, tokenId, PROPOSER_ROLE), "Missing PROPOSER role");
        _;
    }

    modifier onlyExecutor(address token, uint256 tokenId) {
        require(_hasActiveRole(msg.sender, token, tokenId, EXECUTOR_ROLE), "Missing EXECUTOR role");
        _;
    }

    function propose(
        address token,
        uint256 tokenId,
        string calldata description
    ) external onlyProposer(token, tokenId) returns (uint256 id) {
        id = nextProposalId++;
        proposals[id] = Proposal({
            id: id,
            proposer: msg.sender,
            description: description,
            deadline: block.timestamp + votingPeriod,
            forVotes: 0,
            againstVotes: 0,
            executed: false,
            canceled: false
        });
        emit ProposalCreated(id, msg.sender, description, block.timestamp + votingPeriod);
    }

    function vote(
        address token,
        uint256 tokenId,
        uint256 proposalId,
        bool support
    ) external {
        require(_hasActiveRole(msg.sender, token, tokenId, VOTER_ROLE), "Missing VOTER role");
        Proposal storage p = proposals[proposalId];
        require(p.id != 0, "Invalid proposal");
        require(block.timestamp <= p.deadline, "Voting ended");
        require(!hasVoted[proposalId][msg.sender], "Already voted");

        hasVoted[proposalId][msg.sender] = true;
        if (support) p.forVotes += 1; else p.againstVotes += 1;

        emit VoteCast(proposalId, msg.sender, support, 1);
    }

    function execute(
        address token,
        uint256 tokenId,
        uint256 proposalId
    ) external onlyExecutor(token, tokenId) {
        Proposal storage p = proposals[proposalId];
        require(p.id != 0, "Invalid proposal");
        require(!p.executed && !p.canceled, "Finalized");
        require(block.timestamp > p.deadline, "Voting not ended");
        require(p.forVotes >= quorum && p.forVotes > p.againstVotes, "No consensus");

        p.executed = true;
        emit ProposalExecuted(proposalId);
    }

    function cancel(uint256 proposalId) external {
        Proposal storage p = proposals[proposalId];
        require(msg.sender == p.proposer, "Only proposer");
        require(!p.executed && !p.canceled, "Finalized");
        p.canceled = true;
        emit ProposalCanceled(proposalId);
    }

    function setVotingPeriod(uint256 newPeriod) external { votingPeriod = newPeriod; }
    function setQuorum(uint256 newQuorum) external { quorum = newQuorum; }

// Registry: 0x4D1970610508458c784F86939C01a6fD372D5729
// https://sepolia-blockscout.lisk.com/address/0x4D1970610508458c784F86939C01a6fD372D5729#code

// NFT: 0x13ddAA35b0e4B21A32cfCd9c4151bE7a5bc9B01f
// https://sepolia-blockscout.lisk.com/address/0x13ddAA35b0e4B21A32cfCd9c4151bE7a5bc9B01f#code

// DAO: 0xD0e5A1A94a6DceaeeFf1A8D66aA529a3E1f76e08
// https://sepolia-blockscout.lisk.com/address/0xD0e5A1A94a6DceaeeFf1A8D66aA529a3E1f76e08#code

}
