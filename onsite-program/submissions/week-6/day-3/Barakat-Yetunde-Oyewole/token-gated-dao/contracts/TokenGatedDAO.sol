// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./IERC7432.sol";
import "./DAOMembershipNFT.sol";


contract TokenGatedDAO is Ownable, ReentrancyGuard {

    struct Proposal {
        uint256 id;
        address proposer;
        string description;
        bytes callData;
        address target;
        uint256 value;
        uint256 votesFor;
        uint256 votesAgainst;
        uint256 creationTime;
        uint256 votingDeadline;
        bool executed;
        mapping(address => bool) hasVoted;
    }

    DAOMembershipNFT public membershipNFT;
    uint256 private _proposalIdCounter;
    
    mapping(uint256 => Proposal) public proposals;
    uint256[] public proposalIds;
    
    uint256 public votingPeriod = 7 days;
    uint256 public minimumQuorum = 1; 
    
    
    
    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        string description,
        uint256 votingDeadline
    );
    
    event VoteCast(
        uint256 indexed proposalId,
        address indexed voter,
        bool support,
        uint256 tokenId
    );
    
    event ProposalExecuted(uint256 indexed proposalId, bool success);
    
    event MembershipNFTUpdated(address indexed newNFTContract);

    constructor(address _membershipNFT) Ownable(msg.sender) {
        membershipNFT = DAOMembershipNFT(_membershipNFT);
    }

    
    function updateMembershipNFT(address _newNFTContract) external onlyOwner {
        membershipNFT = DAOMembershipNFT(_newNFTContract);
        emit MembershipNFTUpdated(_newNFTContract);
    }

    
    function updateVotingPeriod(uint256 _newVotingPeriod) external onlyOwner {
        require(_newVotingPeriod > 0, "TokenGatedDAO: Voting period must be greater than 0");
        votingPeriod = _newVotingPeriod;
    }

    
    function updateMinimumQuorum(uint256 _newQuorum) external onlyOwner {
        minimumQuorum = _newQuorum;
    }

    
    function createProposal(
        string memory description,
        address target,
        uint256 value,
        bytes memory callData,
        uint256 tokenId
    ) external {
        require(
            _hasProposerRole(msg.sender, tokenId),
            "TokenGatedDAO: Caller does not have proposer role"
        );

        uint256 proposalId = _proposalIdCounter;
        _proposalIdCounter++;

        Proposal storage newProposal = proposals[proposalId];
        newProposal.id = proposalId;
        newProposal.proposer = msg.sender;
        newProposal.description = description;
        newProposal.callData = callData;
        newProposal.target = target;
        newProposal.value = value;
        newProposal.creationTime = block.timestamp;
        newProposal.votingDeadline = block.timestamp + votingPeriod;
        newProposal.executed = false;

        proposalIds.push(proposalId);

        emit ProposalCreated(proposalId, msg.sender, description, newProposal.votingDeadline);
    }

    
    function vote(
        uint256 proposalId,
        bool support,
        uint256 tokenId
    ) external {
        require(
            _hasVoterRole(msg.sender, tokenId),
            "TokenGatedDAO: Caller does not have voter role"
        );
        
        Proposal storage proposal = proposals[proposalId];
        require(proposal.id == proposalId, "TokenGatedDAO: Proposal does not exist");
        require(block.timestamp <= proposal.votingDeadline, "TokenGatedDAO: Voting period has ended");
        require(!proposal.hasVoted[msg.sender], "TokenGatedDAO: Already voted");

        proposal.hasVoted[msg.sender] = true;
        
        if (support) {
            proposal.votesFor++;
        } else {
            proposal.votesAgainst++;
        }

        emit VoteCast(proposalId, msg.sender, support, tokenId);
    }

    
    function executeProposal(uint256 proposalId, uint256 tokenId) external nonReentrant {
        require(
            _hasExecutorRole(msg.sender, tokenId),
            "TokenGatedDAO: Caller does not have executor role"
        );

        Proposal storage proposal = proposals[proposalId];
        require(proposal.id == proposalId, "TokenGatedDAO: Proposal does not exist");
        require(block.timestamp > proposal.votingDeadline, "TokenGatedDAO: Voting period not ended");
        require(!proposal.executed, "TokenGatedDAO: Proposal already executed");
        require(
            proposal.votesFor + proposal.votesAgainst >= minimumQuorum,
            "TokenGatedDAO: Quorum not reached"
        );
        require(proposal.votesFor > proposal.votesAgainst, "TokenGatedDAO: Proposal not passed");

        proposal.executed = true;

        bool success = false;
        if (proposal.target != address(0)) {
            (success, ) = proposal.target.call{value: proposal.value}(proposal.callData);
        } else {
            success = true; 
        }

        emit ProposalExecuted(proposalId, success);
    }

    
    function getProposal(uint256 proposalId) external view returns (
        uint256 id,
        address proposer,
        string memory description,
        address target,
        uint256 value,
        uint256 votesFor,
        uint256 votesAgainst,
        uint256 creationTime,
        uint256 votingDeadline,
        bool executed
    ) {
        Proposal storage proposal = proposals[proposalId];
        return (
            proposal.id,
            proposal.proposer,
            proposal.description,
            proposal.target,
            proposal.value,
            proposal.votesFor,
            proposal.votesAgainst,
            proposal.creationTime,
            proposal.votingDeadline,
            proposal.executed
        );
    }

    
    function getAllProposalIds() external view returns (uint256[] memory) {
        return proposalIds;
    }

    
    function hasVoted(uint256 proposalId, address voter) external view returns (bool) {
        return proposals[proposalId].hasVoted[voter];
    }

    
    function getProposalCount() external view returns (uint256) {
        return _proposalIdCounter;
    }

   
    function _hasProposerRole(address account, uint256 tokenId) internal view returns (bool) {
        try membershipNFT.hasRole(membershipNFT.PROPOSER_ROLE(), tokenId, account) returns (bool hasRole) {
            return hasRole;
        } catch {
            return false;
        }
    }

    function _hasVoterRole(address account, uint256 tokenId) internal view returns (bool) {
        try membershipNFT.hasRole(membershipNFT.VOTER_ROLE(), tokenId, account) returns (bool hasRole) {
            return hasRole;
        } catch {
            return false;
        }
    }

    function _hasExecutorRole(address account, uint256 tokenId) internal view returns (bool) {
        try membershipNFT.hasRole(membershipNFT.EXECUTOR_ROLE(), tokenId, account) returns (bool hasRole) {
            return hasRole;
        } catch {
            return false;
        }
    }

    function _hasAdminRole(address account, uint256 tokenId) internal view returns (bool) {
        try membershipNFT.hasRole(membershipNFT.ADMIN_ROLE(), tokenId, account) returns (bool hasRole) {
            return hasRole;
        } catch {
            return false;
        }
    }

    
    receive() external payable {}

    
    function withdraw(uint256 amount, uint256 tokenId) external {
        require(
            _hasAdminRole(msg.sender, tokenId),
            "TokenGatedDAO: Caller does not have admin role"
        );
        require(address(this).balance >= amount, "TokenGatedDAO: Insufficient balance");
        
        payable(msg.sender).transfer(amount);
    }
}
