// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./interfaces/IERC7432.sol";
import "./DAOMemberNFT.sol";

contract TokenGatedDAO {
    struct Proposal {
        uint256 id;
        string description;
        uint256 votesFor;
        uint256 votesAgainst;
        uint256 endTime;
        bool executed;
        address proposer;
    }

    bytes32 public constant VOTER_ROLE = keccak256("VOTER");
    bytes32 public constant PROPOSER_ROLE = keccak256("PROPOSER");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN");
    
    IERC7432 public immutable nftContract;
    
    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    uint256 public proposalCount;
    uint256 public constant VOTING_DURATION = 7 days;
    uint256 public constant MAX_NFT_CHECK = 1000;
    
    event ProposalCreated(uint256 indexed proposalId, address indexed proposer, string description);
    event VoteCast(uint256 indexed proposalId, address indexed voter, bool support);
    event ProposalExecuted(uint256 indexed proposalId);
    
    constructor(address _nftContract) {
        nftContract = IERC7432(_nftContract);
    }

    modifier hasNFTRole(bytes32 role) {
        require(_checkUserRole(msg.sender, role), "Missing required role");
        _;
    }
    function createProposal(string memory description) 
        external hasNFTRole(PROPOSER_ROLE) returns (uint256) {
        
        proposalCount++;
        
        proposals[proposalCount] = Proposal({
            id: proposalCount,
            description: description,
            votesFor: 0,
            votesAgainst: 0,
            endTime: block.timestamp + VOTING_DURATION,
            executed: false,
            proposer: msg.sender
        });
        
        emit ProposalCreated(proposalCount, msg.sender, description);
        return proposalCount;
    }
    
    function vote(uint256 proposalId, bool support) 
        external hasNFTRole(VOTER_ROLE) {
        
        Proposal storage proposal = proposals[proposalId];
        require(proposal.id != 0, "Proposal does not exist");
        require(block.timestamp < proposal.endTime, "Voting ended");
        require(!hasVoted[proposalId][msg.sender], "Already voted");
        
        hasVoted[proposalId][msg.sender] = true;
        
        if (support) {
            proposal.votesFor++;
        } else {
            proposal.votesAgainst++;
        }
        
        emit VoteCast(proposalId, msg.sender, support);
    }
    
    function executeProposal(uint256 proposalId) 
        external hasNFTRole(ADMIN_ROLE) {
        
        Proposal storage proposal = proposals[proposalId];
        require(proposal.id != 0, "Proposal does not exist");
        require(block.timestamp >= proposal.endTime, "Voting not ended");
        require(!proposal.executed, "Already executed");
        require(proposal.votesFor > proposal.votesAgainst, "Proposal rejected");
        
        proposal.executed = true;
        
      
        emit ProposalExecuted(proposalId);
    }
    

    function getProposal(uint256 proposalId) 
        external view returns (Proposal memory) {
        return proposals[proposalId];
    }
    
    function _checkUserRole(address user, bytes32 role) internal view returns (bool) {
       
        for (uint256 i = 1; i <= MAX_NFT_CHECK; i++) {
            try DAOMemberNFT(address(nftContract)).ownerOf(i) returns (address owner) {
                if (owner == user || nftContract.hasRole(i, role, user)) {
                    return true;
                }
            } catch {
                continue;
            }
        }
        return false;
    }
}