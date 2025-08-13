// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./InstitutionStaffNFT.sol";

/**
 * @title TokenGatedDAO
 * @dev A simplified DAO that uses ERC-7432 roles on NFTs to gate governance participation
 */
contract TokenGatedDAO {
    InstitutionStaffNFT public immutable nftContract;
    
    uint256 private _proposalIdCounter;
    uint256 public constant VOTING_DURATION = 50400; // ~7 days in blocks
    uint256 public constant QUORUM_THRESHOLD = 3;
    
    enum ProposalState { Pending, Active, Defeated, Succeeded, Executed }
    enum VoteType { Against, For, Abstain }
    
    struct Proposal {
        uint256 id;
        address proposer;
        string title;
        string description;
        uint256 startBlock;
        uint256 endBlock;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
        bool executed;
        ProposalState state;
        address target;
        bytes callData;
        uint256 value;
    }
    
    struct Receipt {
        bool hasVoted;
        VoteType support;
        uint256 votes;
    }
    
    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => Receipt)) public receipts;
    uint256[] public proposalIds;
    
    event ProposalCreated(uint256 indexed proposalId, address indexed proposer, string title, string description, uint256 startBlock, uint256 endBlock);
    event VoteCast(address indexed voter, uint256 indexed proposalId, VoteType support, uint256 votes);
    event ProposalExecuted(uint256 indexed proposalId);
    event ProposalStateChanged(uint256 indexed proposalId, ProposalState newState);
    event MemberAdmitted(address indexed member, uint256 indexed tokenId, bytes32 role, string staffType);
    event MemberRemoved(address indexed member);
    event EmergencyMemberAdded(address indexed member, uint256 indexed tokenId, bytes32 role, string staffType);
    
    modifier onlyEligibleVoter() {
        require(nftContract.canVote(msg.sender), "Not eligible to vote");
        _;
    }
    
    modifier onlyAdmin() {
        require(nftContract.isAdmin(msg.sender), "Only admin can perform this action");
        _;
    }
    
    constructor(address _nftContract) {
        require(_nftContract != address(0), "Invalid NFT contract address");
        nftContract = InstitutionStaffNFT(_nftContract);
    }
    
    /**
     * @dev Create a new proposal
     */
 function createProposal(
    string calldata title,
    string calldata description,
    address target,
    bytes calldata callData,
    uint256 value
) external onlyEligibleVoter returns (uint256) {
    require(bytes(title).length > 0, "Title cannot be empty");
    require(bytes(description).length > 0, "Description cannot be empty");

    uint256 proposalId = _proposalIdCounter++;
    Proposal storage proposal = proposals[proposalId];

    proposal.id = proposalId;
    proposal.proposer = msg.sender;
    proposal.title = title;
    proposal.description = description;
    proposal.startBlock = block.number;
    proposal.endBlock = block.number + VOTING_DURATION;
    proposal.forVotes = 0;
    proposal.againstVotes = 0;
    proposal.abstainVotes = 0;
    proposal.executed = false;
    proposal.state = ProposalState.Active;
    proposal.target = target;
    proposal.callData = callData;
    proposal.value = value;

    proposalIds.push(proposalId);

    emit ProposalCreated(proposalId, msg.sender, title, description, block.number, block.number + VOTING_DURATION);

    return proposalId;
}
    
    /**
     * @dev Cast a vote on a proposal
     */
    function castVote(uint256 proposalId, VoteType support) external onlyEligibleVoter {
        require(proposalId < _proposalIdCounter, "Invalid proposal ID");
        
        Proposal storage proposal = proposals[proposalId];
        require(proposal.state == ProposalState.Active, "Proposal not active");
        require(block.number <= proposal.endBlock, "Voting period ended");
        require(!receipts[proposalId][msg.sender].hasVoted, "Already voted");
        
        uint256 votes = 1; // Simple: 1 vote per eligible voter
        
        if (support == VoteType.Against) {
            proposal.againstVotes += votes;
        } else if (support == VoteType.For) {
            proposal.forVotes += votes;
        } else {
            proposal.abstainVotes += votes;
        }
        
        receipts[proposalId][msg.sender] = Receipt({
            hasVoted: true,
            support: support,
            votes: votes
        });
        
        emit VoteCast(msg.sender, proposalId, support, votes);
        
        _updateProposalState(proposalId);
    }
    
    /**
     * @dev Execute a proposal that has succeeded
     */
    function executeProposal(uint256 proposalId) external onlyAdmin {
        require(proposalId < _proposalIdCounter, "Invalid proposal ID");
        
        Proposal storage proposal = proposals[proposalId];
        require(proposal.state == ProposalState.Succeeded, "Proposal not succeeded");
        require(!proposal.executed, "Proposal already executed");
        
        proposal.executed = true;
        proposal.state = ProposalState.Executed;
        
        if (proposal.target != address(0)) {
            (bool success,) = proposal.target.call{value: proposal.value}(proposal.callData);
            require(success, "Proposal execution failed");
        }
        
        emit ProposalExecuted(proposalId);
        emit ProposalStateChanged(proposalId, ProposalState.Executed);
    }
    
    /**
     * @dev Get the current state of a proposal
     */
    // function getProposalState(uint256 proposalId) external view returns (ProposalState) {
    //     require(proposalId < _proposalIdCounter, "Invalid proposal ID");
        
    //     Proposal storage p = proposals[proposalId];
        
    //     if (p.executed) return ProposalState.Executed;
    //     if (block.number <= p.endBlock) return ProposalState.Active;
        
    //     uint256 totalVotes = p.forVotes + p.againstVotes + p.abstainVotes;
        
    //     if (totalVotes < QUORUM_THRESHOLD) return ProposalState.Defeated;
    //     return p.forVotes > p.againstVotes ? ProposalState.Succeeded : ProposalState.Defeated;
    // }
    
    /**
     * @dev Propose adding a new member (simplified)
     */
    // function proposeNewMember(
    //     address candidate,
    //     bytes32 role,
    //     string calldata staffType,
    //     string calldata justification
    // ) external onlyEligibleVoter returns (uint256) {
    //     require(candidate != address(0), "Invalid candidate");
    //     require(!nftContract.canVote(candidate), "Already a member");
        
    //     bytes memory data = abi.encodeWithSignature(
    //         "admitNewMember(address,bytes32,string)",
    //         candidate,
    //         role,
    //         staffType
    //     );
        
    //     return this.createProposal(
    //         "Add New Member",
    //         justification,
    //         address(this),
    //         data,
    //         0
    //     );
    // }
    
    /**
     * @dev Function called when a member admission proposal passes
     */
    function admitNewMember(
        address candidate,
        bytes32 role,
        string calldata staffType
    ) external {
        require(msg.sender == address(this), "Only callable through governance");
        
        uint256 tokenId = nftContract.mintStaff(candidate, staffType);
        
        uint64 expirationDate = uint64(block.timestamp + (365 * 24 * 60 * 60));
        nftContract.grantRole(
            role,
            tokenId,
            candidate,
            expirationDate,
            true,
            abi.encodePacked("Governance-approved member")
        );
        
        emit MemberAdmitted(candidate, tokenId, role, staffType);
    }
    
    /**
     * @dev Emergency member addition by admin
     */
    // function emergencyAddMember(
    //     address candidate,
    //     bytes32 role,
    //     string calldata staffType
    // ) external onlyAdmin {
    //     require(candidate != address(0), "Invalid candidate");
        
    //     uint256 tokenId = nftContract.mintStaff(candidate, staffType);
        
    //     uint64 expirationDate = uint64(block.timestamp + (365 * 24 * 60 * 60));
    //     nftContract.grantRole(
    //         role,
    //         tokenId,
    //         candidate,
    //         expirationDate,
    //         true,
    //         abi.encodePacked("Emergency admission")
    //     );
        
    //     emit EmergencyMemberAdded(candidate, tokenId, role, staffType);
    // }
    
    /**
     * @dev Get proposal details (simplified return)
     */
    function getProposal(uint256 proposalId) external view returns (Proposal memory) {
        require(proposalId < _proposalIdCounter, "Invalid proposal ID");
        return proposals[proposalId];
    }
    
    /**
     * @dev Check if an address can participate in governance
     */
    function canParticipate(address account) external view returns (bool) {
        return nftContract.canVote(account);
    }
    
    /**
     * @dev Get voting power of an account
     */
    function getVotingPower(address account) external view returns (uint256) {
        return nftContract.canVote(account) ? 1 : 0;
    }
    
    /**
     * @dev Get all proposal IDs
     */
    function getAllProposalIds() external view returns (uint256[] memory) {
        return proposalIds;
    }
    
    /**
     * @dev Update proposal state
     */
    function updateProposalState(uint256 proposalId) external {
        _updateProposalState(proposalId);
    }
    
    /**
     * @dev Get total number of proposals
     */
    function getProposalCount() external view returns (uint256) {
        return _proposalIdCounter;
    }
    
    /**
     * @dev Internal function to update proposal state
     */
   function _updateProposalState(uint256 proposalId) internal {
    Proposal storage p = proposals[proposalId];

    if (p.executed) {
        _setProposalState(proposalId, ProposalState.Executed);
        return;
    }

    if (block.number <= p.endBlock) {
        _setProposalState(proposalId, ProposalState.Active);
        return;
    }

    _evaluateProposalOutcome(proposalId, p);
}

function _setProposalState(uint256 proposalId, ProposalState state) internal {
    proposals[proposalId].state = state;
    emit ProposalStateChanged(proposalId, state);
}

function _evaluateProposalOutcome(uint256 proposalId, Proposal storage p) internal {
    uint256 totalVotes = p.forVotes + p.againstVotes + p.abstainVotes;
    if (totalVotes < QUORUM_THRESHOLD) {
        _setProposalState(proposalId, ProposalState.Defeated);
    } else if (p.forVotes > p.againstVotes) {
        _setProposalState(proposalId, ProposalState.Succeeded);
    } else {
        _setProposalState(proposalId, ProposalState.Defeated);
    }
}
    
    /**
     * @dev Receive ETH for proposal execution
     */
    receive() external payable {}
}