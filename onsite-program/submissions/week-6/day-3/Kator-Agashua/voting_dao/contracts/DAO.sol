// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./RoleNFT.sol";

contract DAO {
    RoleNFT public immutable roleNFT;
    
    // Role definitions
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN");
    bytes32 public constant TREASURER_ROLE = keccak256("TREASURER");
    bytes32 public constant VOTER_ROLE = keccak256("VOTER");
    bytes32 public constant MEMBER_ROLE = keccak256("MEMBER");
    
    // Proposal structure
    struct Proposal {
        uint256 id;
        address proposer;
        string title;
        string description;
        uint256 amount; // For funding proposals
        address recipient; // For funding proposals
        uint256 votesFor;
        uint256 votesAgainst;
        uint256 startTime;
        uint256 endTime;
        bool executed;
        mapping(address => bool) hasVoted;
        ProposalType proposalType;
    }
    
    enum ProposalType {
        FUNDING,
        GOVERNANCE,
        ROLE_ASSIGNMENT
    }
    
    uint256 private _proposalIdCounter;
    mapping(uint256 => Proposal) public proposals;
    uint256[] public activeProposals;
    
    // DAO settings
    uint256 public constant VOTING_PERIOD = 7 days;
    uint256 public constant MINIMUM_QUORUM = 3; // Minimum votes needed
    
    // Events
    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        string title,
        ProposalType proposalType
    );
    
    event VoteCast(
        uint256 indexed proposalId,
        address indexed voter,
        bool support,
        bytes32 voterRole
    );
    
    event ProposalExecuted(
        uint256 indexed proposalId,
        bool successful
    );
    
    event FundsWithdrawn(
        address indexed recipient,
        uint256 amount,
        uint256 proposalId
    );
    
    // Errors
    error NotAuthorized(bytes32 requiredRole);
    error ProposalNotFound();
    error VotingEnded();
    error VotingNotEnded();
    error AlreadyVoted();
    error ProposalAlreadyExecuted();
    error InsufficientFunds();
    error QuorumNotMet();
    
    // Modifiers
    modifier onlyRole(bytes32 role) {
        if (!roleNFT.hasRole(msg.sender, role)) {
            revert NotAuthorized(role);
        }
        _;
    }
    
    modifier onlyAdminOrTreasurer() {
        if (!roleNFT.hasRole(msg.sender, ADMIN_ROLE) && 
            !roleNFT.hasRole(msg.sender, TREASURER_ROLE)) {
            revert NotAuthorized(ADMIN_ROLE);
        }
        _;
    }
    
    modifier onlyVoter() {
        if (!roleNFT.hasRole(msg.sender, VOTER_ROLE) && 
            !roleNFT.hasRole(msg.sender, ADMIN_ROLE)) {
            revert NotAuthorized(VOTER_ROLE);
        }
        _;
    }
    
    constructor(address _roleNFT) {
        roleNFT = RoleNFT(_roleNFT);
    }
    
    // Allow contract to receive ETH
    receive() external payable {}
    
    // Create a funding proposal
    function createFundingProposal(
        string memory title,
        string memory description,
        uint256 amount,
        address recipient
    ) external onlyRole(MEMBER_ROLE) returns (uint256) {
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be greater than 0");
        
        uint256 proposalId = ++_proposalIdCounter;
        Proposal storage proposal = proposals[proposalId];
        
        proposal.id = proposalId;
        proposal.proposer = msg.sender;
        proposal.title = title;
        proposal.description = description;
        proposal.amount = amount;
        proposal.recipient = recipient;
        proposal.startTime = block.timestamp;
        proposal.endTime = block.timestamp + VOTING_PERIOD;
        proposal.proposalType = ProposalType.FUNDING;
        
        activeProposals.push(proposalId);
        
        emit ProposalCreated(proposalId, msg.sender, title, ProposalType.FUNDING);
        return proposalId;
    }
    
    // Create a governance proposal
    function createGovernanceProposal(
        string memory title,
        string memory description
    ) external onlyRole(ADMIN_ROLE) returns (uint256) {
        uint256 proposalId = ++_proposalIdCounter;
        Proposal storage proposal = proposals[proposalId];
        
        proposal.id = proposalId;
        proposal.proposer = msg.sender;
        proposal.title = title;
        proposal.description = description;
        proposal.startTime = block.timestamp;
        proposal.endTime = block.timestamp + VOTING_PERIOD;
        proposal.proposalType = ProposalType.GOVERNANCE;
        
        activeProposals.push(proposalId);
        
        emit ProposalCreated(proposalId, msg.sender, title, ProposalType.GOVERNANCE);
        return proposalId;
    }
    
    // Vote on a proposal
    function vote(uint256 proposalId, bool support) external onlyVoter {
        Proposal storage proposal = proposals[proposalId];
        
        if (proposal.id == 0) revert ProposalNotFound();
        if (block.timestamp > proposal.endTime) revert VotingEnded();
        if (proposal.hasVoted[msg.sender]) revert AlreadyVoted();
        
        proposal.hasVoted[msg.sender] = true;
        
        if (support) {
            proposal.votesFor++;
        } else {
            proposal.votesAgainst++;
        }
        
        // Get voter's role for event
        bytes32[] memory roles = roleNFT.getRoles(msg.sender);
        bytes32 voterRole = roles.length > 0 ? roles[0] : bytes32(0);
        
        emit VoteCast(proposalId, msg.sender, support, voterRole);
    }
    
    // Execute a proposal after voting ends
    function executeProposal(uint256 proposalId) external {
        Proposal storage proposal = proposals[proposalId];
        
        if (proposal.id == 0) revert ProposalNotFound();
        if (block.timestamp <= proposal.endTime) revert VotingNotEnded();
        if (proposal.executed) revert ProposalAlreadyExecuted();
        
        uint256 totalVotes = proposal.votesFor + proposal.votesAgainst;
        if (totalVotes < MINIMUM_QUORUM) revert QuorumNotMet();
        
        proposal.executed = true;
        bool successful = proposal.votesFor > proposal.votesAgainst;
        
        if (successful && proposal.proposalType == ProposalType.FUNDING) {
            if (address(this).balance < proposal.amount) revert InsufficientFunds();
            
            (bool sent, ) = proposal.recipient.call{value: proposal.amount}("");
            require(sent, "Failed to send funds");
            
            emit FundsWithdrawn(proposal.recipient, proposal.amount, proposalId);
        }
        
        emit ProposalExecuted(proposalId, successful);
        
        // Remove from active proposals
        _removeFromActiveProposals(proposalId);
    }
    
    // Emergency withdrawal (Admin only)
    function emergencyWithdraw(address recipient, uint256 amount) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        require(address(this).balance >= amount, "Insufficient funds");
        (bool sent, ) = recipient.call{value: amount}("");
        require(sent, "Failed to send funds");
    }
    
    // View functions
    function getProposal(uint256 proposalId) external view returns (
        uint256 id,
        address proposer,
        string memory title,
        string memory description,
        uint256 amount,
        address recipient,
        uint256 votesFor,
        uint256 votesAgainst,
        uint256 startTime,
        uint256 endTime,
        bool executed,
        ProposalType proposalType
    ) {
        Proposal storage proposal = proposals[proposalId];
        return (
            proposal.id,
            proposal.proposer,
            proposal.title,
            proposal.description,
            proposal.amount,
            proposal.recipient,
            proposal.votesFor,
            proposal.votesAgainst,
            proposal.startTime,
            proposal.endTime,
            proposal.executed,
            proposal.proposalType
        );
    }
    
    function getActiveProposals() external view returns (uint256[] memory) {
        return activeProposals;
    }
    
    function hasVoted(uint256 proposalId, address voter) external view returns (bool) {
        return proposals[proposalId].hasVoted[voter];
    }
    
    function getDAOBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    function getUserRole(address user) external view returns (bytes32) {
        bytes32[] memory roles = roleNFT.getRoles(user);
        return roles.length > 0 ? roles[0] : bytes32(0);
    }
    
    // Internal function to remove proposal from active list
    function _removeFromActiveProposals(uint256 proposalId) internal {
        for (uint256 i = 0; i < activeProposals.length; i++) {
            if (activeProposals[i] == proposalId) {
                activeProposals[i] = activeProposals[activeProposals.length - 1];
                activeProposals.pop();
                break;
            }
        }
    }
}