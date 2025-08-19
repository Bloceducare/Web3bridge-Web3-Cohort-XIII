// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IERC7432.sol";
import "./RoleBasedNFT.sol";

contract TokenGatedDAO is Ownable, ReentrancyGuard {
    struct Proposal {
        uint256 id;
        address proposer;
        string title;
        string description;
        uint256 votingStart;
        uint256 votingEnd;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
        bool executed;
        bool cancelled;
        mapping(address => bool) hasVoted;
        mapping(address => VoteChoice) votes;
    }

    enum VoteChoice {
        Against,
        For,
        Abstain
    }

    enum ProposalState {
        Pending,
        Active,
        Cancelled,
        Defeated,
        Succeeded,
        Executed
    }

    RoleBasedNFT public roleBasedNFT;

    uint256 public votingDelay = 1 days;
    uint256 public votingPeriod = 3 days;
    uint256 public proposalThreshold = 1;
    uint256 public quorum = 4;
    
    mapping(uint256 => Proposal) public proposals;
    uint256 public proposalCount;

    mapping(address => uint256) public treasury;

    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        string title,
        string description,
        uint256 votingStart,
        uint256 votingEnd
    );
    
    event VoteCast(
        address indexed voter,
        uint256 indexed proposalId,
        VoteChoice choice,
        uint256 weight,
        string reason
    );
    
    event ProposalExecuted(uint256 indexed proposalId);
    event ProposalCancelled(uint256 indexed proposalId);
    
    modifier onlyMember() {
        require(isMember(msg.sender), "TokenGatedDAO: Not a DAO member");
        _;
    }
    
    modifier onlyAdmin() {
        require(isAdmin(msg.sender), "TokenGatedDAO: Not a DAO admin");
        _;
    }

    constructor(address _roleBasedNFT) Ownable(msg.sender) {
        roleBasedNFT = RoleBasedNFT(_roleBasedNFT);
    }

    function isMember(address account) public view returns (bool) {
        uint256 totalSupply = roleBasedNFT.totalSupply();
        for (uint256 tokenId = 0; tokenId < totalSupply; tokenId++) {
            if (roleBasedNFT.hasRole(roleBasedNFT.DAO_MEMBER_ROLE(), tokenId, account)) {
                return true;
            }
        }
        return false;
    }

    function isAdmin(address account) public view returns (bool) {
        uint256 totalSupply = roleBasedNFT.totalSupply();
        for (uint256 tokenId = 0; tokenId < totalSupply; tokenId++) {
            if (roleBasedNFT.hasRole(roleBasedNFT.DAO_ADMIN_ROLE(), tokenId, account)) {
                return true;
            }
        }
        return false;
    }

    function canCreateProposal(address account) public view returns (bool) {
        uint256 totalSupply = roleBasedNFT.totalSupply();
        for (uint256 tokenId = 0; tokenId < totalSupply; tokenId++) {
            if (roleBasedNFT.hasRole(roleBasedNFT.PROPOSAL_CREATOR_ROLE(), tokenId, account)) {
                return true;
            }
        }
        return false;
    }

    function canVote(address account) public view returns (bool) {
        uint256 totalSupply = roleBasedNFT.totalSupply();
        for (uint256 tokenId = 0; tokenId < totalSupply; tokenId++) {
            if (roleBasedNFT.hasRole(roleBasedNFT.VOTER_ROLE(), tokenId, account)) {
                return true;
            }
        }
        return false;
    }

    function getVotingPower(address account) public view returns (uint256) {
        uint256 votingPower = 0;
        uint256 totalSupply = roleBasedNFT.totalSupply();
        
        for (uint256 tokenId = 0; tokenId < totalSupply; tokenId++) {
            if (roleBasedNFT.hasRole(roleBasedNFT.VOTER_ROLE(), tokenId, account)) {
                votingPower++;
            }
        }
        
        return votingPower;
    }

    function propose(
        string memory title,
        string memory description
    ) external returns (uint256) {
        require(canCreateProposal(msg.sender), "TokenGatedDAO: Not authorized to create proposals");
        require(getVotingPower(msg.sender) >= proposalThreshold, "TokenGatedDAO: Below proposal threshold");
        
        uint256 proposalId = proposalCount++;
        Proposal storage proposal = proposals[proposalId];
        
        proposal.id = proposalId;
        proposal.proposer = msg.sender;
        proposal.title = title;
        proposal.description = description;
        proposal.votingStart = block.timestamp + votingDelay;
        proposal.votingEnd = proposal.votingStart + votingPeriod;
        
        emit ProposalCreated(
            proposalId,
            msg.sender,
            title,
            description,
            proposal.votingStart,
            proposal.votingEnd
        );
        
        return proposalId;
    }

    function castVote(
        uint256 proposalId,
        VoteChoice choice,
        string memory reason
    ) external {
        require(canVote(msg.sender), "TokenGatedDAO: Not authorized to vote");
        require(proposalId < proposalCount, "TokenGatedDAO: Invalid proposal ID");
        
        Proposal storage proposal = proposals[proposalId];
        require(!proposal.hasVoted[msg.sender], "TokenGatedDAO: Already voted");
        require(block.timestamp >= proposal.votingStart, "TokenGatedDAO: Voting not started");
        require(block.timestamp <= proposal.votingEnd, "TokenGatedDAO: Voting ended");
        require(!proposal.cancelled, "TokenGatedDAO: Proposal cancelled");
        
        uint256 weight = getVotingPower(msg.sender);
        require(weight > 0, "TokenGatedDAO: No voting power");
        
        proposal.hasVoted[msg.sender] = true;
        proposal.votes[msg.sender] = choice;
        
        if (choice == VoteChoice.For) {
            proposal.forVotes += weight;
        } else if (choice == VoteChoice.Against) {
            proposal.againstVotes += weight;
        } else {
            proposal.abstainVotes += weight;
        }
        
        emit VoteCast(msg.sender, proposalId, choice, weight, reason);
    }

    function getProposalState(uint256 proposalId) public view returns (ProposalState) {
        require(proposalId < proposalCount, "TokenGatedDAO: Invalid proposal ID");
        
        Proposal storage proposal = proposals[proposalId];
        
        if (proposal.cancelled) {
            return ProposalState.Cancelled;
        }
        
        if (proposal.executed) {
            return ProposalState.Executed;
        }
        
        if (block.timestamp < proposal.votingStart) {
            return ProposalState.Pending;
        }
        
        if (block.timestamp <= proposal.votingEnd) {
            return ProposalState.Active;
        }
        
        uint256 totalVotes = proposal.forVotes + proposal.againstVotes + proposal.abstainVotes;
        if (totalVotes >= quorum && proposal.forVotes > proposal.againstVotes) {
            return ProposalState.Succeeded;
        }
        
        return ProposalState.Defeated;
    }

    function executeProposal(uint256 proposalId) external onlyAdmin {
        require(proposalId < proposalCount, "TokenGatedDAO: Invalid proposal ID");
        require(getProposalState(proposalId) == ProposalState.Succeeded, "TokenGatedDAO: Proposal not succeeded");
        
        Proposal storage proposal = proposals[proposalId];
        proposal.executed = true;

        emit ProposalExecuted(proposalId);
    }

    function cancelProposal(uint256 proposalId) external {
        require(proposalId < proposalCount, "TokenGatedDAO: Invalid proposal ID");
        
        Proposal storage proposal = proposals[proposalId];
        require(
            msg.sender == proposal.proposer || isAdmin(msg.sender),
            "TokenGatedDAO: Not authorized to cancel"
        );
        require(!proposal.executed, "TokenGatedDAO: Proposal already executed");
        
        proposal.cancelled = true;
        emit ProposalCancelled(proposalId);
    }

    function getProposal(uint256 proposalId) external view returns (
        uint256 id,
        address proposer,
        string memory title,
        string memory description,
        uint256 votingStart,
        uint256 votingEnd,
        uint256 forVotes,
        uint256 againstVotes,
        uint256 abstainVotes,
        bool executed,
        bool cancelled
    ) {
        require(proposalId < proposalCount, "TokenGatedDAO: Invalid proposal ID");
        
        Proposal storage proposal = proposals[proposalId];
        return (
            proposal.id,
            proposal.proposer,
            proposal.title,
            proposal.description,
            proposal.votingStart,
            proposal.votingEnd,
            proposal.forVotes,
            proposal.againstVotes,
            proposal.abstainVotes,
            proposal.executed,
            proposal.cancelled
        );
    }

    function updateConfig(
        uint256 _votingDelay,
        uint256 _votingPeriod,
        uint256 _proposalThreshold,
        uint256 _quorum
    ) external onlyAdmin {
        votingDelay = _votingDelay;
        votingPeriod = _votingPeriod;
        proposalThreshold = _proposalThreshold;
        quorum = _quorum;
    }
    receive() external payable {
        treasury[address(0)] += msg.value;
    }

    function withdrawFromTreasury(address to, uint256 amount) external onlyAdmin nonReentrant {
        require(treasury[address(0)] >= amount, "TokenGatedDAO: Insufficient treasury balance");
        treasury[address(0)] -= amount;
        
        (bool success, ) = payable(to).call{value: amount}("");
        require(success, "TokenGatedDAO: Transfer failed");
    }
}
