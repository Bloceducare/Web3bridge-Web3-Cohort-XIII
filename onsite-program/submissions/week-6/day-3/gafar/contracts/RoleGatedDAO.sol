// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;
import "./RoleBasedNFT.sol";

contract RoleGatedDAO {
  IERC7432 public immutable roles;
  address  public immutable nft; 

  bytes32 public constant ROLE_PROPOSER = keccak256("DAO_PROPOSER()");
  bytes32 public constant ROLE_VOTER    = keccak256("DAO_VOTER()");
  bytes32 public constant ROLE_EXECUTOR = keccak256("DAO_EXECUTOR()");
  bytes32 public constant ROLE_MEMBER   = keccak256("DAO_MEMBER()");

  uint256 public proposalCount;

  struct Proposal {
    address proposer;
    string  description;
    uint64  deadline;
    uint256 yes;
    uint256 no;
    bool    executed;
  }

  mapping(uint256 => Proposal) public proposals;
  mapping(uint256 => mapping(address => bool)) public hasVoted;

  event Proposed(uint256 indexed id, address indexed proposer, string description, uint64 deadline);
  event Voted(uint256 indexed id, address indexed voter, bool support, uint256 weight);
  event Executed(uint256 indexed id, bool passed);

  constructor(address nftWithRoles) {
    nft = nftWithRoles;
    roles = IERC7432(nftWithRoles);
  }

  function _hasActiveRole(address account, uint256 tokenId, bytes32 roleId) internal view returns (bool) {
    if (roles.recipientOf(nft, tokenId, roleId) != account) return false;
    uint64 exp = roles.roleExpirationDate(nft, tokenId, roleId);
    return exp == type(uint64).max || exp > block.timestamp;
  }

  function propose(uint256 tokenId, string calldata description, uint64 votingPeriodSeconds) external returns (uint256 id) {
    require(_hasActiveRole(msg.sender, tokenId, ROLE_PROPOSER), "Missing PROPOSER role");
    id = ++proposalCount;
    proposals[id] = Proposal({
      proposer: msg.sender,
      description: description,
      deadline: uint64(block.timestamp) + votingPeriodSeconds,
      yes: 0,
      no: 0,
      executed: false
    });
    emit Proposed(id, msg.sender, description, proposals[id].deadline);
  }

  function vote(uint256 proposalId, uint256 tokenId, bool support) external {
    Proposal storage p = proposals[proposalId];
    require(p.deadline != 0, "No such proposal");
    require(block.timestamp < p.deadline, "Voting ended");
    require(!hasVoted[proposalId][msg.sender], "Already voted");
    require(_hasActiveRole(msg.sender, tokenId, ROLE_VOTER), "Missing VOTER role");

    hasVoted[proposalId][msg.sender] = true;
    uint256 weight = 1;
    if (support) p.yes += weight;
    else p.no += weight;

    emit Voted(proposalId, msg.sender, support, weight);
  }

  function execute(uint256 proposalId, uint256 tokenId) external {
    Proposal storage p = proposals[proposalId];
    require(p.deadline != 0, "No such proposal");
    require(block.timestamp >= p.deadline, "Voting not ended");
    require(!p.executed, "Already executed");
    require(_hasActiveRole(msg.sender, tokenId, ROLE_EXECUTOR), "Missing EXECUTOR role");

    bool passed = p.yes > p.no;
    p.executed = true;
    emit Executed(proposalId, passed);

  }

  function accessResource(uint256 tokenId) external view returns (string memory) {
    require(_hasActiveRole(msg.sender, tokenId, ROLE_MEMBER), "Missing MEMBER role");
    return "Secret DAO resource granted.";
  }
}
