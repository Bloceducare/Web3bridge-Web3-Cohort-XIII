// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./interfaces/IERC7432.sol";

contract RoleGatedDAO {
    IERC7432 public immutable rolesRegistry;
    address public immutable membershipNFT;

    bytes32 public constant PROPOSER_ROLE = keccak256("DAO.Proposer()");
    bytes32 public constant VOTER_ROLE    = keccak256("DAO.Voter()");
    bytes32 public constant EXECUTOR_ROLE = keccak256("DAO.Executor()");

    struct Proposal {
        address proposer;
        string description;
        uint256 deadline;
        uint256 yesVotes;
        uint256 noVotes;
        bool executed;
    }

    Proposal[] public proposals;
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    event ProposalCreated(uint256 indexed proposalId, address indexed proposer, string description, uint256 deadline);
    event VoteCast(uint256 indexed proposalId, address indexed voter, bool support, uint256 weight);
    event Executed(uint256 indexed proposalId);

    constructor(address _rolesRegistry, address _membershipNFT) {
        rolesRegistry = IERC7432(_rolesRegistry);
        membershipNFT = _membershipNFT;
    }

    function _hasRole(address user, bytes32 roleId, address tokenAddress, uint256 tokenId)
        internal
        view
        returns (bool)
    {
        if (rolesRegistry.recipientOf(tokenAddress, tokenId, roleId) != user) return false;
        uint64 expiry = rolesRegistry.roleExpirationDate(tokenAddress, tokenId, roleId);
        return expiry >= block.timestamp;
    }

    modifier onlyRole(bytes32 roleId, address tokenAddress, uint256 tokenId) {
        require(_hasRole(msg.sender, roleId, tokenAddress, tokenId), "role required");
        _;
    }

    function createProposal(
        string calldata description,
        uint256 votingPeriodSeconds,
        address tokenAddress,
        uint256 tokenId
    )
        external
        onlyRole(PROPOSER_ROLE, tokenAddress, tokenId)
        returns (uint256 proposalId)
    {
        require(votingPeriodSeconds > 0, "period=0");
        proposalId = proposals.length;
        proposals.push(Proposal({
            proposer: msg.sender,
            description: description,
            deadline: block.timestamp + votingPeriodSeconds,
            yesVotes: 0,
            noVotes: 0,
            executed: false
        }));
        emit ProposalCreated(proposalId, msg.sender, description, block.timestamp + votingPeriodSeconds);
    }

    function vote(
        uint256 proposalId,
        bool support,
        address tokenAddress,
        uint256 tokenId
    )
        external
        onlyRole(VOTER_ROLE, tokenAddress, tokenId)
    {
        Proposal storage p = proposals[proposalId];
        require(block.timestamp < p.deadline, "ended");
        require(!hasVoted[proposalId][msg.sender], "already voted");
        hasVoted[proposalId][msg.sender] = true;

        if (support) p.yesVotes += 1;
        else p.noVotes += 1;

        emit VoteCast(proposalId, msg.sender, support, 1);
    }

    function execute(
        uint256 proposalId,
        address tokenAddress,
        uint256 tokenId
    )
        external
        onlyRole(EXECUTOR_ROLE, tokenAddress, tokenId)
    {
        Proposal storage p = proposals[proposalId];
        require(!p.executed, "executed");
        require(block.timestamp >= p.deadline, "not finished");
        require(p.yesVotes > p.noVotes, "did not pass");
        p.executed = true;
        emit Executed(proposalId);
    }

    function proposalCount() external view returns (uint256) {
        return proposals.length;
    }
}
