// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "../Interfaces/IERC7432.sol";

contract TokenGatedDAO {
    struct Proposal {
        string description;
        uint256 deadline;
        uint256 forVotes;
        uint256 againstVotes;
        bool executed;
        mapping(bytes32 => bool) voted;
    }

    event Proposed(uint256 indexed id, address indexed proposer, uint256 tokenId, string description, uint256 deadline);
    event Voted(uint256 indexed id, address indexed voter, uint256 tokenId, bool support, uint256 weight);
    event Executed(uint256 indexed id, bool passed);

    IERC7432 public immutable rolesRegistry;
    address public immutable membershipCollection;

    bytes32 public constant ROLE_PROPOSER = keccak256("DAO_PROPOSER()");
    bytes32 public constant ROLE_VOTER = keccak256("DAO_VOTER()");
    bytes32 public constant ROLE_EXECUTOR = keccak256("DAO_EXECUTOR()");

    uint256 public votingPeriod = 3 days;
    uint256 public proposalCount;
    mapping(uint256 => Proposal) private _proposals;

    constructor(address _rolesRegistry, address _membershipCollection) {
        rolesRegistry = IERC7432(_rolesRegistry);
        membershipCollection = _membershipCollection;
    }

    function _roleActive(bytes32 roleId, address account, uint256 tokenId) internal view returns (bool) {
        if (rolesRegistry.recipientOf(membershipCollection, tokenId, roleId) != account) return false;
        uint64 exp = rolesRegistry.roleExpirationDate(membershipCollection, tokenId, roleId);
        return (exp == type(uint64).max || exp >= block.timestamp);
    }

    function propose(string calldata description, uint256 tokenId) external returns (uint256) {
        require(_roleActive(ROLE_PROPOSER, msg.sender, tokenId), "Not a proposer for this token");
        proposalCount++;
        Proposal storage p = _proposals[proposalCount];
        p.description = description;
        p.deadline = block.timestamp + votingPeriod;
        emit Proposed(proposalCount, msg.sender, tokenId, description, p.deadline);
        return proposalCount;
    }

function hasVotingRights(address account, uint256 tokenId) public view returns (bool) {
    return _roleActive(ROLE_VOTER, account, tokenId);
}

    function vote(uint256 id, uint256 tokenId, bool support) external {
        Proposal storage p = _proposals[id];
        require(p.deadline != 0, "No such proposal");
        require(block.timestamp < p.deadline, "Voting ended");
        require(_roleActive(ROLE_VOTER, msg.sender, tokenId), "Not a voter for this token");

        bytes32 voteKey = keccak256(abi.encodePacked(membershipCollection, tokenId, ROLE_VOTER));
        require(!p.voted[voteKey], "Already voted for this token");
        p.voted[voteKey] = true;

        if (support) p.forVotes++; else p.againstVotes++;
        emit Voted(id, msg.sender, tokenId, support, 1);
    }

    function execute(uint256 id, uint256 tokenId) external {
        Proposal storage p = _proposals[id];
        require(p.deadline != 0, "No such proposal");
        require(block.timestamp >= p.deadline, "Voting not ended");
        require(!p.executed, "Already executed");
        require(_roleActive(ROLE_EXECUTOR, msg.sender, tokenId), "Not an executor for this token");

        bool passed = p.forVotes > p.againstVotes;
        p.executed = true;
        emit Executed(id, passed);
    }

    function getProposal(uint256 id) external view returns (
        string memory description,
        uint256 deadline,
        uint256 forVotes,
        uint256 againstVotes,
        bool executed
    ) {
        Proposal storage p = _proposals[id];
        return (p.description, p.deadline, p.forVotes, p.againstVotes, p.executed);
    }
}
