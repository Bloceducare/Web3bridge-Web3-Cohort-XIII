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

    // Track user's token IDs for efficient role checking
    mapping(address => uint256[]) public userTokens;
    mapping(uint256 => address) public tokenOwners;

    event ProposalCreated(uint256 indexed proposalId, string description, uint256 deadline);
    event VoteCast(uint256 indexed proposalId, address indexed voter, bool support);
    event ProposalExecuted(uint256 indexed proposalId);

    modifier onlyRoleHolder(bytes32 role) {
        require(hasValidRole(msg.sender, role), "Insufficient role permissions");
        _;
    }

    constructor(address _roleNFT) {
        require(_roleNFT != address(0), "RoleNFT address cannot be zero");
        roleNFT = IERC7432(_roleNFT);
    }

    function hasValidRole(address account, bytes32 role) public view returns (bool) {
        // Check roles for tokens owned by the account
        uint256[] memory tokens = userTokens[account];
        for (uint256 i = 0; i < tokens.length; i++) {
            try roleNFT.hasRole(role, tokens[i], account) returns (bool hasRole) {
                if (hasRole) {
                    return true;
                }
            } catch {
                // Token might not exist or role not granted, continue
                continue;
            }
        }
        return false;
    }

    // Function to register token ownership for efficient role checking
    function registerTokenOwnership(uint256 tokenId, address owner) external {
        require(msg.sender == address(roleNFT), "Only RoleNFT can register");

        // Remove from previous owner if exists
        address previousOwner = tokenOwners[tokenId];
        if (previousOwner != address(0)) {
            _removeTokenFromUser(previousOwner, tokenId);
        }

        // Add to new owner
        userTokens[owner].push(tokenId);
        tokenOwners[tokenId] = owner;
    }

    function _removeTokenFromUser(address user, uint256 tokenId) internal {
        uint256[] storage tokens = userTokens[user];
        for (uint256 i = 0; i < tokens.length; i++) {
            if (tokens[i] == tokenId) {
                tokens[i] = tokens[tokens.length - 1];
                tokens.pop();
                break;
            }
        }
    }

    function createProposal(string memory description) external onlyRoleHolder(PROPOSER_ROLE) returns (uint256) {
        require(bytes(description).length > 0, "Proposal description cannot be empty");
        require(bytes(description).length <= 1000, "Proposal description too long");

        uint256 proposalId = proposalCount++;
        Proposal storage proposal = proposals[proposalId];
        proposal.id = proposalId;
        proposal.description = description;
        proposal.deadline = block.timestamp + VOTING_PERIOD;

        emit ProposalCreated(proposalId, description, proposal.deadline);
        return proposalId;
    }

    function vote(uint256 proposalId, bool support) external onlyRoleHolder(VOTER_ROLE) {
        require(proposalId < proposalCount, "Proposal does not exist");

        Proposal storage proposal = proposals[proposalId];
        require(proposal.deadline > 0, "Invalid proposal");
        require(!proposal.executed, "Proposal already executed");
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
        require(proposalId < proposalCount, "Proposal does not exist");

        Proposal storage proposal = proposals[proposalId];
        require(proposal.deadline > 0, "Invalid proposal");
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