// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {TimelockController} from "@openzeppelin/contracts/governance/TimelockController.sol";
import {IERC7432} from "./interfaces/IERC7432.sol";


contract DAO is ReentrancyGuard {
    IERC7432 public immutable rolesContract;
    address public immutable nftAddress;
    TimelockController public immutable timelock;

    bytes32 public constant PROPOSER_ROLE = keccak256("PROPOSER_ROLE");
    bytes32 public constant VOTER_ROLE = keccak256("VOTER_ROLE");
    
    uint256 public votingPeriod; 
    uint256 public quorumVotes; 

    enum ProposalState { Pending, Active, Canceled, Defeated, Succeeded, Queued, Executed }
    
    struct Proposal {
        uint256 id;
        address proposer;
        address[] targets;
        uint256[] values;
        bytes[] calldatas;
        string description;
        uint256 voteStart;
        uint256 voteEnd;
        uint256 yesVotes;
        uint256 noVotes;
        bool canceled;
        mapping(uint256 => bool) hasVoted; 
    }

    uint256 public nextProposalId;
    mapping(uint256 => Proposal) public proposals;

    constructor(address _roles, address _nft, address _timelock, uint256 _votingPeriod, uint256 _quorum) {
        rolesContract = IERC7432(_roles);
        nftAddress = _nft;
        timelock = TimelockController(_timelock);
        votingPeriod = _votingPeriod;
        quorumVotes = _quorum;
    }

    function createProposal(
        address[] calldata targets,
        uint256[] calldata values,
        bytes[] calldata calldatas,
        string calldata description,
        uint256 tokenId
    ) external returns (uint256) {
        
        if (!rolesContract.hasRole(PROPOSER_ROLE, nftAddress, tokenId, msg.sender)) {
            revert ();
        }

        uint256 proposalId = nextProposalId++;
        Proposal storage p = proposals[proposalId];
        p.id = proposalId;
        p.proposer = msg.sender;
        p.targets = targets;
        p.values = values;
        p.calldatas = calldatas;
        p.description = description;
        p.voteStart = block.number;
        p.voteEnd = block.number + votingPeriod;

        return proposalId;
    }

    function vote(uint256 proposalId, bool support, uint256 tokenId) external {
        Proposal storage p = proposals[proposalId];
     
        if (!rolesContract.hasRole(VOTER_ROLE, nftAddress, tokenId, msg.sender)) {
            revert();
        }
       
    }

    function state(uint256 proposalId) public view returns (ProposalState) {
        Proposal storage p = proposals[proposalId];
        if (p.canceled) return ProposalState.Canceled;
        if (block.number <= p.voteEnd) return ProposalState.Active;
        if (p.yesVotes <= p.noVotes || p.yesVotes < quorumVotes) return ProposalState.Defeated;
        
        bytes32 proposalHash = keccak256(abi.encode(p.targets, p.values, p.calldatas, keccak256(bytes(p.description))));
        if (timelock.isOperationDone(proposalHash)) return ProposalState.Executed;
        if (timelock.isOperationPending(proposalHash)) return ProposalState.Queued;

        return ProposalState.Succeeded;
    }

    function queue(uint256 proposalId) external nonReentrant {
        if (state(proposalId) != ProposalState.Succeeded) revert /* InvalidState */();
        Proposal storage p = proposals[proposalId];
        bytes32 descriptionHash = keccak256(bytes(p.description));
      
        timelock.scheduleBatch(p.targets, p.values, p.calldatas, bytes32(0), descriptionHash, timelock.getMinDelay());
      
    }

    function execute(uint256 proposalId) external nonReentrant {
        if (state(proposalId) != ProposalState.Queued) revert /* InvalidState */();
        Proposal storage p = proposals[proposalId];
        bytes32 descriptionHash = keccak256(bytes(p.description));
      
      
        timelock.executeBatch(p.targets, p.values, p.calldatas, bytes32(0), descriptionHash);
       
    }
}