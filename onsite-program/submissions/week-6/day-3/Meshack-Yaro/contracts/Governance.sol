// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./RoleRegistry.sol";

contract CustomDAOGovernance is Ownable, ReentrancyGuard {
    RoleRegistry public immutable roleRegistry;
    address public immutable nftContract;
    bytes32 public constant PROPOSER_ROLE = keccak256("Proposer");
    bytes32 public constant VOTER_ROLE = keccak256("Voter");
    bytes32 public constant ADMIN_ROLE = keccak256("Admin");
    bytes32 public constant TREASURY_ROLE = keccak256("TreasuryManager");

    enum ProposalStatus { Pending, Approved, Rejected, Executed }

    struct Proposal {
        address proposer;
        string description;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 startBlock;
        uint256 endBlock;
        ProposalStatus status;
        mapping(address => bool) hasVoted;
    }

    mapping(uint256 => Proposal) public proposals;
    uint256 public proposalCount;
    uint256 public constant VOTING_PERIOD = 50400; // ~1 week (block-based)

    event ProposalCreated(uint256 indexed proposalId, address proposer, string description);
    event Voted(uint256 indexed proposalId, address voter, bool support, uint256 weight);
    event ProposalApproved(uint256 indexed proposalId);
    event ProposalRejected(uint256 indexed proposalId);
    event ProposalExecuted(uint256 indexed proposalId);

    constructor(address _nftContract, RoleRegistry _roleRegistry) Ownable(msg.sender) {
        nftContract = _nftContract;
        roleRegistry = _roleRegistry;
    }

    // Create a proposal (Proposer role required)
    function propose(string memory description) external returns (uint256) {
        (uint256[] memory tokenIds, ) = roleRegistry.getTokensWithRole(nftContract, msg.sender, PROPOSER_ROLE);
        require(tokenIds.length > 0, "Not a Proposer");

        proposalCount++;
        Proposal storage newProposal = proposals[proposalCount];
        newProposal.proposer = msg.sender;
        newProposal.description = description;
        newProposal.startBlock = block.number;
        newProposal.endBlock = block.number + VOTING_PERIOD;
        newProposal.status = ProposalStatus.Pending;

        emit ProposalCreated(proposalCount, msg.sender, description);
        return proposalCount;
    }

    // Vote on a proposal (Voter role required)
    function vote(uint256 proposalId, bool support) external nonReentrant {
        Proposal storage proposal = proposals[proposalId];
        require(block.number <= proposal.endBlock, "Voting closed");
        require(!proposal.hasVoted[msg.sender], "Already voted");
        require(proposal.status == ProposalStatus.Pending, "Not pending");

        (uint256[] memory tokenIds, uint256[] memory weights) = roleRegistry.getTokensWithRole(nftContract, msg.sender, VOTER_ROLE);
        require(tokenIds.length > 0, "Not a Voter");

        uint256 totalWeight = 0;
        for (uint256 i = 0; i < weights.length; i++) {
            totalWeight += weights[i];
        }

        if (support) {
            proposal.forVotes += totalWeight;
        } else {
            proposal.againstVotes += totalWeight;
        }
        proposal.hasVoted[msg.sender] = true;

        emit Voted(proposalId, msg.sender, support, totalWeight);
    }

    // Approve or reject a proposal (Admin role required)
    function reviewProposal(uint256 proposalId, bool approve) external {
        (uint256[] memory tokenIds, ) = roleRegistry.getTokensWithRole(nftContract, msg.sender, ADMIN_ROLE);
        require(tokenIds.length > 0, "Not an Admin");

        Proposal storage proposal = proposals[proposalId];
        require(block.number > proposal.endBlock, "Voting not ended");
        require(proposal.status == ProposalStatus.Pending, "Not pending");

        if (approve) {
            proposal.status = ProposalStatus.Approved;
            emit ProposalApproved(proposalId);
        } else {
            proposal.status = ProposalStatus.Rejected;
            emit ProposalRejected(proposalId);
        }
    }

    // Execute an approved proposal (Admin role required)
    function execute(uint256 proposalId) external nonReentrant {
        (uint256[] memory tokenIds, ) = roleRegistry.getTokensWithRole(nftContract, msg.sender, ADMIN_ROLE);
        require(tokenIds.length > 0, "Not an Admin");

        Proposal storage proposal = proposals[proposalId];
        require(proposal.status == ProposalStatus.Approved, "Not approved");

        proposal.status = ProposalStatus.Executed;
        // No on-chain actions; execution marks approval for off-chain use
        emit ProposalExecuted(proposalId);
    }

    // Treasury withdrawal (TreasuryManager role required)
    function withdraw(address payable to, uint256 amount) external nonReentrant {
        (uint256[] memory tokenIds, ) = roleRegistry.getTokensWithRole(nftContract, msg.sender, TREASURY_ROLE);
        require(tokenIds.length > 0, "Not a TreasuryManager");
        require(amount <= address(this).balance, "Insufficient balance");
        to.transfer(amount);
    }

    // Allow contract to receive ETH
    receive() external payable {}
}