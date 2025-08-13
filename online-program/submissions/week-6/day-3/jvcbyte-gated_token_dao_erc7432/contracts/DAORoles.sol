// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "./interfaces/IERC7432.sol";

/**
 * @title DAORoles
 * @dev Implements role-based access control for a DAO using ERC-7432 NFT roles
 */
contract DAORoles is Context, AccessControl, Ownable {
    // State variables
    IERC7432 public erc7432;
    address public nftContract;
    
    // Role definitions
    bytes32 public constant VOTER_ROLE = keccak256("VOTER_ROLE");
    bytes32 public constant PROPOSER_ROLE = keccak256("PROPOSER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    
    // DAO configuration
    uint256 public minProposalVotingPower;
    uint256 public minVotingPower;
    
    // Proposal counter
    uint256 public proposalCount;
    
    // Proposal structure
    struct Proposal {
        uint256 id;
        address proposer;
        string description;
        uint256 votingPower;
        uint256 startTime;
        uint256 endTime;
        bool executed;
        bool passed;
        mapping(address => bool) hasVoted;
        uint256 yesVotes;
        uint256 noVotes;
    }
    
    // Mapping from proposal ID to Proposal
    mapping(uint256 => Proposal) public proposals;
    
    // Mapping from token ID to voting power
    mapping(uint256 => uint256) public tokenVotingPower;
    
    // Events
    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        string description,
        uint256 votingPower,
        uint256 startTime,
        uint256 endTime
    );
    
    event VoteCast(
        uint256 indexed proposalId,
        address indexed voter,
        bool support,
        uint256 votingPower
    );
    
    event ProposalExecuted(uint256 indexed proposalId);
    event VotingPowerUpdated(uint256 tokenId, uint256 newVotingPower);
    
    modifier onlyAdmin() {
        require(hasRole(ADMIN_ROLE, msg.sender), "Caller is not an admin");
        _;
    }
    
    modifier onlyProposer() {
        uint256[] memory tokenIds = getTokensWithRole(msg.sender, PROPOSER_ROLE);
        require(tokenIds.length > 0, "Caller has no proposal rights");
        _;
    }
    
    /**
     * @dev Constructor
     * @param _erc7432 Address of the ERC-7432 contract
     * @param _nftContract Address of the NFT contract
     * @param _admin Address of the admin
     */
    constructor(address _erc7432, address _nftContract, address _admin) Ownable(_admin) {
        require(_erc7432 != address(0), "Invalid ERC7432 address");
        require(_nftContract != address(0), "Invalid NFT contract address");
        require(_admin != address(0), "Invalid admin address");
        
        // Initialize state variables
        erc7432 = IERC7432(_erc7432);
        nftContract = _nftContract;
        
        // Set up roles
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(ADMIN_ROLE, _admin);
        
        // Set up role hierarchy
        _setRoleAdmin(ADMIN_ROLE, DEFAULT_ADMIN_ROLE);
        _setRoleAdmin(VOTER_ROLE, ADMIN_ROLE);
        _setRoleAdmin(PROPOSER_ROLE, ADMIN_ROLE);
        
        // Default DAO configuration
        minProposalVotingPower = 1;
        minVotingPower = 1;
    }
    
    /**
     * @dev Create a new proposal
     * @param description Description of the proposal
     * @param duration Duration of the voting period in seconds
     */
    function createProposal(string memory description, uint256 duration) external returns (uint256) {
        address sender = Context._msgSender();
        require(hasRole(PROPOSER_ROLE, sender) || hasRole(ADMIN_ROLE, sender), "Caller is not a proposer or admin");
        require(bytes(description).length > 0, "Description cannot be empty");
        require(duration > 0, "Duration must be greater than 0");
        
        // Check if the caller has the required voting power
        uint256 votingPower = getVotingPower(sender);
        require(votingPower >= minProposalVotingPower, "Insufficient voting power to create proposal");
        
        uint256 proposalId = proposalCount++;
        Proposal storage newProposal = proposals[proposalId];
        newProposal.id = proposalId;
        newProposal.proposer = sender;
        newProposal.description = description;
        newProposal.votingPower = votingPower;
        newProposal.startTime = block.timestamp;
        newProposal.endTime = block.timestamp + duration;
        newProposal.executed = false;
        newProposal.passed = false;
        
        emit ProposalCreated(proposalId, sender, description, votingPower, newProposal.startTime, newProposal.endTime);
        
        return proposalId;
    }
    
    /**
     * @dev Vote on a proposal
     * @param proposalId ID of the proposal to vote on
     * @param support Whether to support the proposal (true) or reject it (false)
     */
    function vote(uint256 proposalId, bool support) external {
        address sender = Context._msgSender();
        require(hasRole(VOTER_ROLE, sender) || hasRole(ADMIN_ROLE, sender), "Caller is not a voter or admin");
        require(proposalId < proposalCount, "Invalid proposal ID");
        
        Proposal storage proposal = proposals[proposalId];
        require(block.timestamp >= proposal.startTime && block.timestamp <= proposal.endTime, "Voting period has ended");
        require(!proposal.hasVoted[sender], "Already voted on this proposal");
        
        uint256 votingPower = getVotingPower(sender);
        require(votingPower >= minVotingPower, "Insufficient voting power to vote");
        
        proposal.hasVoted[sender] = true;
        
        if (support) {
            proposal.yesVotes += votingPower;
        } else {
            proposal.noVotes += votingPower;
        }
        
        emit VoteCast(proposalId, sender, support, votingPower);
    }
    
    /**
     * @dev Execute a proposal after voting has ended
     * @param proposalId ID of the proposal to execute
     */
    function executeProposal(uint256 proposalId) external {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.id == proposalId, "Proposal does not exist");
        require(block.timestamp > proposal.endTime, "Voting has not ended");
        require(!proposal.executed, "Proposal already executed");
        
        // Check if the proposal passed
        if (proposal.yesVotes > proposal.noVotes) {
            proposal.passed = true;
            // Here you would implement the actual proposal execution logic
            // For example, call external contracts, transfer funds, etc.
        }
        
        proposal.executed = true;
        emit ProposalExecuted(proposalId);
    }
    
    /**
     * @dev Get the voting power of an account based on their NFTs with VOTER_ROLE
     * @param account Address of the account to check
     * @return Total voting power of the account
     */
    function getVotingPower(address account) public view returns (uint256) {
        uint256 totalVotingPower = 0;
        // In a real implementation, you would query the ERC-7432 contract
        // to get all tokens with VOTER_ROLE for the account and sum their voting power
        // This is a simplified version
        uint256[] memory tokenIds = getTokensWithRole(account, VOTER_ROLE);
        
        for (uint256 i = 0; i < tokenIds.length; i++) {
            totalVotingPower += tokenVotingPower[tokenIds[i]];
        }
        
        return totalVotingPower;
    }
    
    /**
     * @dev Get all token IDs for an account that have a specific role
     * @param account Address of the account to check
     * @param role Role to check for
     * @return Array of token IDs that have the specified role for the account
     */
    function getTokensWithRole(address account, bytes32 role) public view returns (uint256[] memory) {
        // In a real implementation, you would query the ERC-7432 contract
        // to get all tokens with the specified role for the account
        // This is a simplified version that returns an empty array
        // You would need to implement the actual logic based on your ERC-7432 implementation
        uint256[] memory tokenIds = new uint256[](0);
        return tokenIds;
    }
    
    /**
     * @dev Set the voting power for a token
     * @param tokenId ID of the token
     * @param votingPower New voting power for the token
     */
    function setTokenVotingPower(uint256 tokenId, uint256 votingPower) external onlyAdmin {
        tokenVotingPower[tokenId] = votingPower;
        emit VotingPowerUpdated(tokenId, votingPower);
    }
    
    /**
     * @dev Set the minimum voting power required to create a proposal
     * @param _minProposalVotingPower New minimum voting power
     */
    function setMinProposalVotingPower(uint256 _minProposalVotingPower) external onlyAdmin {
        minProposalVotingPower = _minProposalVotingPower;
    }
    
    /**
     * @dev Set the minimum voting power required to vote
     * @param _minVotingPower New minimum voting power
     */
    function setMinVotingPower(uint256 _minVotingPower) external onlyAdmin {
        minVotingPower = _minVotingPower;
    }
}
