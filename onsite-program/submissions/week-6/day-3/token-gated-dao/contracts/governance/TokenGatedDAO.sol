// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "../interfaces/IERC7432.sol";
import "../utils/RoleValidator.sol";

contract TokenGatedDAO is ReentrancyGuard, Ownable {
    // Removed the incorrect using directive
    // using RoleValidator for RoleValidator;

    bytes32 public constant VOTER_ROLE = keccak256("VOTER_ROLE");
    bytes32 public constant PROPOSER_ROLE = keccak256("PROPOSER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant TREASURY_ROLE = keccak256("TREASURY_ROLE");
    bytes32 public constant VETO_ROLE = keccak256("VETO_ROLE");

    enum ProposalState {
        Pending,
        Active,
        Canceled,
        Defeated,
        Succeeded,
        Queued,
        Expired,
        Executed
    }

    enum VoteType {
        Against,
        For,
        Abstain
    }

    struct Proposal {
        uint256 id;
        address proposer;
        address[] targets;
        uint256[] values;
        bytes[] calldatas;
        string description;
        uint256 startBlock;
        uint256 endBlock;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
        bool canceled;
        bool executed;
        mapping(address => bool) hasVoted;
        mapping(address => uint256) votingPower;
    }

    struct ProposalCore {
        uint256 id;
        address proposer;
        string description;
        uint256 startBlock;
        uint256 endBlock;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
        bool canceled;
        bool executed;
    }
    
    address public nftContract;
    RoleValidator public roleValidator;
    
    uint256 public proposalCounter;
    uint256 public votingDelay = 1 days; 
    uint256 public votingPeriod = 7 days;
    uint256 public proposalThreshold = 1;
    uint256 public quorum = 4; 
    
    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    
    mapping(address => uint256) public treasuryBalances;
    
    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        address[] targets,
        uint256[] values,
        string[] signatures,
        bytes[] calldatas,
        uint256 startBlock,
        uint256 endBlock,
        string description
    );
    
    event VoteCast(
        address indexed voter,
        uint256 indexed proposalId,
        uint8 support,
        uint256 weight,
        string reason
    );
    
    event ProposalExecuted(uint256 indexed proposalId);
    event ProposalCanceled(uint256 indexed proposalId);
    event TreasuryDeposit(address indexed token, uint256 amount);
    event TreasuryWithdrawal(address indexed token, uint256 amount, address indexed to);

    modifier onlyRoleHolder(bytes32 role) {
        require(
            _hasRole(msg.sender, role),
            "TokenGatedDAO: caller does not have required role"
        );
        _;
    }

    modifier validProposal(uint256 proposalId) {
        require(
            proposalId > 0 && proposalId <= proposalCounter,
            "TokenGatedDAO: invalid proposal id"
        );
        _;
    }

    constructor(
        address _nftContract,
        address _roleValidator
    ) {
        nftContract = _nftContract;
        roleValidator = RoleValidator(_roleValidator);
    }

    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    ) external onlyRoleHolder(PROPOSER_ROLE) returns (uint256) {
        require(
            targets.length == values.length && targets.length == calldatas.length,
            "TokenGatedDAO: proposal function information arity mismatch"
        );
        require(targets.length > 0, "TokenGatedDAO: empty proposal");

        proposalCounter++;
        uint256 proposalId = proposalCounter;

        Proposal storage proposal = proposals[proposalId];
        proposal.id = proposalId;
        proposal.proposer = msg.sender;
        proposal.targets = targets;
        proposal.values = values;
        proposal.calldatas = calldatas;
        proposal.description = description;
        proposal.startBlock = block.number + votingDelay;
        proposal.endBlock = proposal.startBlock + votingPeriod;

        emit ProposalCreated(
            proposalId,
            msg.sender,
            targets,
            values,
            new string[](targets.length),
            calldatas,
            proposal.startBlock,
            proposal.endBlock,
            description
        );

        return proposalId;
    }

    function castVote(
        uint256 proposalId,
        uint8 support,
        string memory reason
    ) external validProposal(proposalId) onlyRoleHolder(VOTER_ROLE) {
        return _castVote(proposalId, msg.sender, support, reason);
    }

    function execute(uint256 proposalId) 
        external 
        validProposal(proposalId) 
        nonReentrant 
    {
        ProposalState currentState = state(proposalId);
        require(
            currentState == ProposalState.Succeeded,
            "TokenGatedDAO: proposal not successful"
        );

        Proposal storage proposal = proposals[proposalId];
        proposal.executed = true;

        for (uint256 i = 0; i < proposal.targets.length; i++) {
            (bool success, ) = proposal.targets[i].call{value: proposal.values[i]}(
                proposal.calldatas[i]
            );
            require(success, "TokenGatedDAO: execution failed");
        }

        emit ProposalExecuted(proposalId);
    }

    function cancel(uint256 proposalId) external validProposal(proposalId) {
        Proposal storage proposal = proposals[proposalId];
        require(
            msg.sender == proposal.proposer || _hasRole(msg.sender, ADMIN_ROLE),
            "TokenGatedDAO: only proposer or admin can cancel"
        );
        require(
            state(proposalId) == ProposalState.Pending || 
            state(proposalId) == ProposalState.Active,
            "TokenGatedDAO: cannot cancel executed proposal"
        );

        proposal.canceled = true;
        emit ProposalCanceled(proposalId);
    }

    function veto(uint256 proposalId) 
        external 
        validProposal(proposalId) 
        onlyRoleHolder(VETO_ROLE) 
    {
        Proposal storage proposal = proposals[proposalId];
        require(!proposal.executed, "TokenGatedDAO: cannot veto executed proposal");
        
        proposal.canceled = true;
        emit ProposalCanceled(proposalId);
    }

    function state(uint256 proposalId) public view validProposal(proposalId) returns (ProposalState) {
        Proposal storage proposal = proposals[proposalId];

        if (proposal.canceled) {
            return ProposalState.Canceled;
        } else if (proposal.executed) {
            return ProposalState.Executed;
        } else if (block.number <= proposal.startBlock) {
            return ProposalState.Pending;
        } else if (block.number <= proposal.endBlock) {
            return ProposalState.Active;
        } else if (proposal.forVotes <= proposal.againstVotes || _quorumReached(proposalId) == false) {
            return ProposalState.Defeated;
        } else {
            return ProposalState.Succeeded;
        }
    }

    function getProposal(uint256 proposalId) 
        external 
        view 
        validProposal(proposalId) 
        returns (ProposalCore memory) 
    {
        Proposal storage proposal = proposals[proposalId];
        return ProposalCore({
            id: proposal.id,
            proposer: proposal.proposer,
            description: proposal.description,
            startBlock: proposal.startBlock,
            endBlock: proposal.endBlock,
            forVotes: proposal.forVotes,
            againstVotes: proposal.againstVotes,
            abstainVotes: proposal.abstainVotes,
            canceled: proposal.canceled,
            executed: proposal.executed
        });
    }

    // Made this function public so it can be called both externally and internally
    function depositToTreasury() public payable {
        treasuryBalances[address(0)] += msg.value;
        emit TreasuryDeposit(address(0), msg.value);
    }

    function withdrawFromTreasury(
        address token,
        uint256 amount,
        address to
    ) external onlyRoleHolder(TREASURY_ROLE) {
        require(treasuryBalances[token] >= amount, "TokenGatedDAO: insufficient balance");
        
        treasuryBalances[token] -= amount;
        
        if (token == address(0)) {
            (bool success, ) = to.call{value: amount}("");
            require(success, "TokenGatedDAO: ETH transfer failed");
        } else {
            // Add ERC20 token transfer logic here if needed
        }
        
        emit TreasuryWithdrawal(token, amount, to);
    }

    function updateSettings(
        uint256 _votingDelay,
        uint256 _votingPeriod,
        uint256 _proposalThreshold,
        uint256 _quorum
    ) external onlyRoleHolder(ADMIN_ROLE) {
        votingDelay = _votingDelay;
        votingPeriod = _votingPeriod;
        proposalThreshold = _proposalThreshold;
        quorum = _quorum;
    }

    function _castVote(
        uint256 proposalId,
        address account,
        uint8 support,
        string memory reason
    ) internal {
        require(state(proposalId) == ProposalState.Active, "TokenGatedDAO: voting is closed");
        require(!hasVoted[proposalId][account], "TokenGatedDAO: vote already cast");

        uint256 weight = _getVotingPower(account);
        require(weight > 0, "TokenGatedDAO: no voting power");

        hasVoted[proposalId][account] = true;

        Proposal storage proposal = proposals[proposalId];
        
        if (support == uint8(VoteType.Against)) {
            proposal.againstVotes += weight;
        } else if (support == uint8(VoteType.For)) {
            proposal.forVotes += weight;
        } else if (support == uint8(VoteType.Abstain)) {
            proposal.abstainVotes += weight;
        } else {
            revert("TokenGatedDAO: invalid vote type");
        }

        emit VoteCast(account, proposalId, support, weight, reason);
    }

    function _hasRole(address account, bytes32 role) internal view returns (bool) {
        return roleValidator.hasAnyTokenWithRole(nftContract, account, role);
    }

    function _getVotingPower(address account) internal view returns (uint256) {
        bytes32[] memory powerRoles = new bytes32[](1);
        uint256[] memory weights = new uint256[](1);
        
        powerRoles[0] = VOTER_ROLE;
        weights[0] = 1; 
        
        return roleValidator.calculateVotingPower(nftContract, account, powerRoles, weights);
    }

    function _quorumReached(uint256 proposalId) internal view returns (bool) {
        Proposal storage proposal = proposals[proposalId];
        return (proposal.forVotes + proposal.againstVotes + proposal.abstainVotes) >= quorum;
    }

    function getVotingPower(address account) external view returns (uint256) {
        return _getVotingPower(account);
    }

    function hasRole(address account, bytes32 role) external view returns (bool) {
        return _hasRole(account, role);
    }

    // Fixed: Now calls the public function instead of treating it as external
    receive() external payable {
        depositToTreasury();
    }
}