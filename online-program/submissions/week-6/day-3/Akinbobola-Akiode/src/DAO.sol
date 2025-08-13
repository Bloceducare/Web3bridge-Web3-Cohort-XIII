// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./interfaces/IERC7432.sol";
import "./interfaces/IERC721.sol";

contract DAO {
    bytes32 public constant PROPOSER_ROLE = keccak256("PROPOSER_ROLE");
    bytes32 public constant VOTER_ROLE = keccak256("VOTER_ROLE");
    bytes32 public constant EXECUTOR_ROLE = keccak256("EXECUTOR_ROLE");
    
    IERC7432 public rolesRegistry;
    IERC721 public governanceNFT;
    
    struct Proposal {
        uint256 id;
        address proposer;
        uint256 proposerTokenId;
        string description;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 startBlock;
        uint256 endBlock;
        bool executed;
        bool canceled;
        address[] votersSnapshot;
        uint256[] voterTokenIds;
        mapping(address => bool) hasVoted;
        mapping(address => bool) support;
    }
    
    struct ProposalView {
        uint256 id;
        address proposer;
        uint256 proposerTokenId;
        string description;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 startBlock;
        uint256 endBlock;
        bool executed;
        bool canceled;
        address[] votersSnapshot;
        uint256[] voterTokenIds;
    }
    
    uint256 public proposalCount;
    mapping(uint256 => Proposal) public proposals;
    
    event ProposalCreated(uint256 indexed proposalId, address indexed proposer, uint256 proposerTokenId, string description, uint256 startBlock, uint256 endBlock);
    event Voted(uint256 indexed proposalId, address indexed voter, uint256 voterTokenId, bool support, uint256 weight);
    event ProposalExecuted(uint256 indexed proposalId);
    event ProposalCanceled(uint256 indexed proposalId);
    
    constructor(address _rolesRegistry, address _governanceNFT) {
        rolesRegistry = IERC7432(_rolesRegistry);
        governanceNFT = IERC721(_governanceNFT);
    }
    
    function createProposal(string memory description, uint256 votingPeriod, uint256 tokenId) external returns (uint256) {
        require(governanceNFT.ownerOf(tokenId) == msg.sender, "DAO: caller does not own the NFT");
        require(rolesRegistry.hasRole(PROPOSER_ROLE, msg.sender, tokenId), "DAO: NFT does not have proposer role");
        
        uint256 proposalId = proposalCount++;
        Proposal storage proposal = proposals[proposalId];
        
        proposal.id = proposalId;
        proposal.proposer = msg.sender;
        proposal.proposerTokenId = tokenId;
        proposal.description = description;
        proposal.startBlock = block.number;
        proposal.endBlock = block.number + votingPeriod;
        proposal.executed = false;
        proposal.canceled = false;
        
        _snapshotVoters(proposalId);
        
        emit ProposalCreated(proposalId, msg.sender, tokenId, description, proposal.startBlock, proposal.endBlock);
        
        return proposalId;
    }
    
    mapping(address => bool) public eligibleVoters;
    address[] public eligibleVoterList;
    
    function registerAsVoter(uint256 tokenId) external {
        require(governanceNFT.ownerOf(tokenId) == msg.sender, "DAO: caller does not own the NFT");
        require(rolesRegistry.hasRole(VOTER_ROLE, msg.sender, tokenId), "DAO: NFT does not have voter role");
        
        if (!eligibleVoters[msg.sender]) {
            eligibleVoters[msg.sender] = true;
            eligibleVoterList.push(msg.sender);
        }
    }
    
    function _snapshotVoters(uint256 proposalId) internal {
        Proposal storage proposal = proposals[proposalId];
        
        for (uint256 i = 0; i < eligibleVoterList.length; i++) {
            address voter = eligibleVoterList[i];
            if (eligibleVoters[voter]) {
                proposal.votersSnapshot.push(voter);
            }
        }
    }
    
    function vote(uint256 proposalId, bool support, uint256 tokenId) external {
        require(governanceNFT.ownerOf(tokenId) == msg.sender, "DAO: caller does not own the NFT");
        require(rolesRegistry.hasRole(VOTER_ROLE, msg.sender, tokenId), "DAO: NFT does not have voter role");
        
        Proposal storage proposal = proposals[proposalId];
        
        require(block.number >= proposal.startBlock, "DAO: voting not started");
        require(block.number <= proposal.endBlock, "DAO: voting ended");
        require(!proposal.hasVoted[msg.sender], "DAO: already voted");
        require(!proposal.executed, "DAO: proposal already executed");
        require(!proposal.canceled, "DAO: proposal canceled");
        require(_isInSnapshot(msg.sender, proposalId), "DAO: not in voter snapshot");
        
        proposal.hasVoted[msg.sender] = true;
        proposal.support[msg.sender] = support;
        
        if (support) {
            proposal.forVotes++;
        } else {
            proposal.againstVotes++;
        }
        
        emit Voted(proposalId, msg.sender, tokenId, support, 1);
    }
    
    function _isInSnapshot(address voter, uint256 proposalId) internal view returns (bool) {
        Proposal storage proposal = proposals[proposalId];
        for (uint256 i = 0; i < proposal.votersSnapshot.length; i++) {
            if (proposal.votersSnapshot[i] == voter) {
                return true;
            }
        }
        return false;
    }
    
    function executeProposal(uint256 proposalId, uint256 tokenId) external {
        require(governanceNFT.ownerOf(tokenId) == msg.sender, "DAO: caller does not own the NFT");
        require(rolesRegistry.hasRole(EXECUTOR_ROLE, msg.sender, tokenId), "DAO: NFT does not have executor role");
        
        Proposal storage proposal = proposals[proposalId];
        
        require(block.number > proposal.endBlock, "DAO: voting not ended");
        require(!proposal.executed, "DAO: proposal already executed");
        require(!proposal.canceled, "DAO: proposal canceled");
        require(proposal.forVotes > proposal.againstVotes, "DAO: proposal did not pass");
        
        proposal.executed = true;
        
        emit ProposalExecuted(proposalId);
    }
    
    function cancelProposal(uint256 proposalId) external {
        Proposal storage proposal = proposals[proposalId];
        
        require(msg.sender == proposal.proposer, "DAO: only proposer can cancel");
        require(block.number <= proposal.startBlock, "DAO: voting already started");
        require(!proposal.executed, "DAO: proposal already executed");
        require(!proposal.canceled, "DAO: proposal already canceled");
        
        proposal.canceled = true;
        
        emit ProposalCanceled(proposalId);
    }
    
    function getProposal(uint256 proposalId) external view returns (ProposalView memory) {
        Proposal storage proposal = proposals[proposalId];
        return ProposalView({
            id: proposal.id,
            proposer: proposal.proposer,
            proposerTokenId: proposal.proposerTokenId,
            description: proposal.description,
            forVotes: proposal.forVotes,
            againstVotes: proposal.againstVotes,
            startBlock: proposal.startBlock,
            endBlock: proposal.endBlock,
            executed: proposal.executed,
            canceled: proposal.canceled,
            votersSnapshot: proposal.votersSnapshot,
            voterTokenIds: proposal.voterTokenIds
        });
    }
    
    function hasVoted(uint256 proposalId, address voter) external view returns (bool) {
        return proposals[proposalId].hasVoted[voter];
    }
    
    function getVoterSnapshot(uint256 proposalId) external view returns (address[] memory) {
        return proposals[proposalId].votersSnapshot;
    }
    
    function getEligibleVoterCount() external view returns (uint256) {
        return eligibleVoterList.length;
    }
}