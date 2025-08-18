// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;


import "./IERC7432.sol";
import "./ParticipantNFT.sol";

contract DAO is IERC7432 {
    address public immutable participantNFT;

    mapping(address => mapping(uint256 => address)) private _originalOwners;
    mapping(address => mapping(uint256 => mapping(bytes32 => address))) private _roleRecipients;
    mapping(address => mapping(uint256 => mapping(bytes32 => uint64))) private _roleExpirationDates;
    mapping(address => mapping(uint256 => mapping(bytes32 => bool))) private _roleRevocables;
    mapping(address => uint256) public userTokenId;

    bytes32 public constant PRIMARY_ROLE = keccak256("PRIMARY");
    bytes32 public constant SECONDARY_ROLE = keccak256("SECONDARY");
    bytes32 public constant TERTIARY_ROLE = keccak256("TERTIARY");

    struct Proposal {
        string description;
        uint256 yesVotes;
        uint256 noVotes;
        uint256 deadline;
        bool executed;
        mapping(address => bool) voters;
    }

    mapping(uint256 => Proposal) public proposals;
    uint256 public proposalCount;

    event ProposalCreated(uint256 indexed proposalId, address indexed proposer, string description);
    event Voted(uint256 indexed proposalId, address indexed voter, bool support);
    event ProposalExecuted(uint256 indexed proposalId);

    constructor() {
        participantNFT = address(new ParticipantNFT(address(this)));
    }

    function grantRole(Role calldata _role) external override {
        address tokenAddr = _role.tokenAddress;
        uint256 tokenId = _role.tokenId;
        bytes32 roleId = _role.roleId;
        address owner = _originalOwners[tokenAddr][tokenId];
        require(owner != address(0), "Token not registered");
        require(ParticipantNFT(tokenAddr).ownerOf(tokenId) == address(this), "Token not held by registry");
        require(msg.sender == owner, "Only owner can grant");
        require(_role.expirationDate > uint64(block.timestamp), "Expiration date in past");
        require(
            _roleRecipients[tokenAddr][tokenId][roleId] == address(0) ||
                _roleExpirationDates[tokenAddr][tokenId][roleId] <= uint64(block.timestamp),
            "Role already active"
        );

        _roleRecipients[tokenAddr][tokenId][roleId] = _role.recipient;
        _roleExpirationDates[tokenAddr][tokenId][roleId] = _role.expirationDate;
        _roleRevocables[tokenAddr][tokenId][roleId] = _role.revocable;
        emit RoleGranted(tokenAddr, tokenId, roleId, owner, _role.recipient, _role.expirationDate, _role.revocable, _role.data);
    }

    function register() external {
        require(userTokenId[msg.sender] == 0, "User already registered");
        uint256 tokenId = ParticipantNFT(participantNFT).mint(address(this));
        _originalOwners[participantNFT][tokenId] = msg.sender;
        userTokenId[msg.sender] = tokenId;
        emit TokenLocked(msg.sender, participantNFT, tokenId);

        // Grant default PRIMARY role
        Role memory role = Role({
            roleId: PRIMARY_ROLE,
            tokenAddress: participantNFT,
            tokenId: tokenId,
            recipient: msg.sender,
            expirationDate: type(uint64).max,
            revocable: true,
            data: ""
        });
        this.grantRole(role);
    }

    function revokeRole(address tokenAddr, uint256 tokenId, bytes32 roleId) external override {
        address owner = _originalOwners[tokenAddr][tokenId];
        require(owner != address(0), "Token not registered");
        address recipient = _roleRecipients[tokenAddr][tokenId][roleId];
        require(recipient != address(0), "No role assigned");
        bool isExpired = _roleExpirationDates[tokenAddr][tokenId][roleId] <= uint64(block.timestamp);
        bool revocable = _roleRevocables[tokenAddr][tokenId][roleId];
        require(msg.sender == owner || msg.sender == recipient, "Not authorized");
        require(isExpired || revocable, "Cannot revoke active role");

        _roleRecipients[tokenAddr][tokenId][roleId] = address(0);
        _roleExpirationDates[tokenAddr][tokenId][roleId] = 0;
        _roleRevocables[tokenAddr][tokenId][roleId] = false;
        emit RoleRevoked(tokenAddr, tokenId, roleId);
    }

    function unlockToken(address tokenAddr, uint256 tokenId) external override {
        address owner = _originalOwners[tokenAddr][tokenId];
        require(owner != address(0), "Token not registered");
        require(ParticipantNFT(tokenAddr).ownerOf(tokenId) == address(this), "Token not held by registry");
        require(msg.sender == owner, "Only owner can unlock");

        require(!_isActiveNonRevocable(tokenAddr, tokenId, PRIMARY_ROLE), "Active non-revocable PRIMARY role");
        require(!_isActiveNonRevocable(tokenAddr, tokenId, SECONDARY_ROLE), "Active non-revocable SECONDARY role");
        require(!_isActiveNonRevocable(tokenAddr, tokenId, TERTIARY_ROLE), "Active non-revocable TERTIARY role");

        ParticipantNFT(tokenAddr).transferFrom(address(this), owner, tokenId);
        delete _originalOwners[tokenAddr][tokenId];
        delete userTokenId[owner];
        emit TokenUnlocked(owner, tokenAddr, tokenId);
    }

    function ownerOf(address tokenAddr, uint256 tokenId) external view override returns (address) {
        return _originalOwners[tokenAddr][tokenId];
    }

    function recipientOf(address tokenAddr, uint256 tokenId, bytes32 roleId) external view override returns (address) {
        return _roleRecipients[tokenAddr][tokenId][roleId];
    }

    function roleExpirationDate(address tokenAddr, uint256 tokenId, bytes32 roleId) external view override returns (uint64) {
        return _roleExpirationDates[tokenAddr][tokenId][roleId];
    }

    function isRoleRevocable(address tokenAddr, uint256 tokenId, bytes32 roleId) external view override returns (bool) {
        return _roleRevocables[tokenAddr][tokenId][roleId];
    }

    function _isActiveNonRevocable(address tokenAddr, uint256 tokenId, bytes32 roleId) private view returns (bool) {
        address recip = _roleRecipients[tokenAddr][tokenId][roleId];
        if (recip == address(0)) return false;
        return _roleExpirationDates[tokenAddr][tokenId][roleId] > uint64(block.timestamp) && !_roleRevocables[tokenAddr][tokenId][roleId];
    }

    // Governance functions
    function propose(string calldata description, uint256 duration) external {
        require(hasProposePermission(msg.sender), "No permission to propose");
        uint256 proposalId = proposalCount++;
        Proposal storage newProposal = proposals[proposalId];
        newProposal.description = description;
        newProposal.deadline = block.timestamp + duration;
        newProposal.executed = false;
        emit ProposalCreated(proposalId, msg.sender, description);
    }

    function vote(uint256 proposalId, bool support) external {
        require(hasVotePermission(msg.sender), "No permission to vote");
        require(proposalId < proposalCount, "Invalid proposal ID");
        Proposal storage proposal = proposals[proposalId];
        require(!proposal.voters[msg.sender], "Already voted");
        require(block.timestamp <= proposal.deadline, "Voting period ended");

        proposal.voters[msg.sender] = true;
        if (support) {
            proposal.yesVotes++;
        } else {
            proposal.noVotes++;
        }
        emit Voted(proposalId, msg.sender, support);
    }

    function executeProposal(uint256 proposalId) external {
        require(proposalId < proposalCount, "Invalid proposal ID");
        Proposal storage proposal = proposals[proposalId];
        require(block.timestamp > proposal.deadline, "Voting period has not ended");
        require(!proposal.executed, "Proposal already executed");
        require(proposal.yesVotes > proposal.noVotes, "Proposal did not pass");

        proposal.executed = true;
        // Add execution logic (e.g., DAO actions)
        emit ProposalExecuted(proposalId);
    }

    function hasProposePermission(address user) public view returns (bool) {
        uint256 tokenId = userTokenId[user];
        if (tokenId == 0) return false;
        address recip = _roleRecipients[participantNFT][tokenId][PRIMARY_ROLE];
        uint64 exp = _roleExpirationDates[participantNFT][tokenId][PRIMARY_ROLE];
        return recip == user && exp > uint64(block.timestamp);
    }

    function hasVotePermission(address user) public view returns (bool) {
        uint256 tokenId = userTokenId[user];
        if (tokenId == 0) return false;
        bool isPrimary = _roleRecipients[participantNFT][tokenId][PRIMARY_ROLE] == user &&
                        _roleExpirationDates[participantNFT][tokenId][PRIMARY_ROLE] > uint64(block.timestamp);
        bool isSecondary = _roleRecipients[participantNFT][tokenId][SECONDARY_ROLE] == user &&
                          _roleExpirationDates[participantNFT][tokenId][SECONDARY_ROLE] > uint64(block.timestamp);
        return isPrimary || isSecondary;
    }

    // Helper function to get proposal details
    function getProposalDetails(uint256 proposalId) external view returns (string memory description, uint256 yesVotes, uint256 noVotes, uint256 deadline, bool executed) {
        require(proposalId < proposalCount, "Invalid proposal ID");
        Proposal storage proposal = proposals[proposalId];
        return (proposal.description, proposal.yesVotes, proposal.noVotes, proposal.deadline, proposal.executed);
    }

    // Helper function to check if user has voted
    function hasUserVoted(uint256 proposalId, address user) external view returns (bool) {
        require(proposalId < proposalCount, "Invalid proposal ID");
        return proposals[proposalId].voters[user];
    }
}