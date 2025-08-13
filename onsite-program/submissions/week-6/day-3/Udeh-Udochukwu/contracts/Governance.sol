//SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.26;
import "./IERC7432.sol";
import "./MembershipNFT.sol";


contract GovernanceRoleRegistry is IERC7432 {
  address public immutable membershipNFT;

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
    bool executed;
  }

  Proposal[] public proposals;

  constructor() {
    membershipNFT = address(new MembershipNFT(address(this)));
  }

    function grantRole(Role calldata _role) external {
    address tokenAddr = _role.tokenAddress;
    uint256 tokenId = _role.tokenId;
    bytes32 roleId = _role.roleId;
    address owner = _originalOwners[tokenAddr][tokenId];
    require(owner != address(0), "Token not locked");
    require(MembershipNFT(tokenAddr).ownerOf(tokenId) == address(this), "Not held by registry");
    require(msg.sender == owner, "Not owner"); // Simplified: only owner can grant
    require(_role.expirationDate > uint64(block.timestamp), "Expiration in past");
    require(_roleRecipients[tokenAddr][tokenId][roleId] == address(0) || 
            _roleExpirationDates[tokenAddr][tokenId][roleId] <= uint64(block.timestamp), 
            "Role already assigned");

    _roleRecipients[tokenAddr][tokenId][roleId] = _role.recipient;
    _roleExpirationDates[tokenAddr][tokenId][roleId] = _role.expirationDate;
    _roleRevocables[tokenAddr][tokenId][roleId] = _role.revocable;
    emit RoleGranted(tokenAddr, tokenId, roleId, owner, _role.recipient, _role.expirationDate, _role.revocable, _role.data);
  }


  function register() external {
    require(userTokenId[msg.sender] == 0, "Already registered");
    uint256 tokenId = MembershipNFT(membershipNFT).mint(address(this));
    _originalOwners[membershipNFT][tokenId] = msg.sender;
    userTokenId[msg.sender] = tokenId;
    emit TokenLocked(msg.sender, membershipNFT, tokenId);

    // Grant default PRIMARY role
    Role memory role = Role({
      roleId: PRIMARY_ROLE,
      tokenAddress: membershipNFT,
      tokenId: tokenId,
      recipient: msg.sender,
      expirationDate: type(uint64).max,
      revocable: true,
      data: ""
    });
    this.grantRole(role);
  }


  function revokeRole(address tokenAddr, uint256 tokenId, bytes32 roleId) external {
    address owner = _originalOwners[tokenAddr][tokenId];
    require(owner != address(0), "Token not locked");
    address recipient = _roleRecipients[tokenAddr][tokenId][roleId];
    require(recipient != address(0), "No role assigned");
    bool isExpired = _roleExpirationDates[tokenAddr][tokenId][roleId] <= uint64(block.timestamp);
    bool revocable = _roleRevocables[tokenAddr][tokenId][roleId];
    require(msg.sender == owner || msg.sender == recipient, "Not authorized");
    require(isExpired || revocable, "Non-revocable role");

    _roleRecipients[tokenAddr][tokenId][roleId] = address(0);
    _roleExpirationDates[tokenAddr][tokenId][roleId] = 0;
    _roleRevocables[tokenAddr][tokenId][roleId] = false;
    emit RoleRevoked(tokenAddr, tokenId, roleId);
  }

  function unlockToken(address tokenAddr, uint256 tokenId) external {
    address owner = _originalOwners[tokenAddr][tokenId];
    require(owner != address(0), "Token not locked");
    require(MembershipNFT(tokenAddr).ownerOf(tokenId) == address(this), "Not held by registry");
    require(msg.sender == owner, "Not owner");

    // Check for active non-revocable roles
    require(!_isActiveNonRevocable(tokenAddr, tokenId, PRIMARY_ROLE), "Active non-revocable role");
    require(!_isActiveNonRevocable(tokenAddr, tokenId, SECONDARY_ROLE), "Active non-revocable role");
    require(!_isActiveNonRevocable(tokenAddr, tokenId, TERTIARY_ROLE), "Active non-revocable role");

    MembershipNFT(tokenAddr).transferFrom(address(this), owner, tokenId);
    delete _originalOwners[tokenAddr][tokenId];
    emit TokenUnlocked(owner, tokenAddr, tokenId);
  }

  function ownerOf(address tokenAddr, uint256 tokenId) external view returns (address) {
    return _originalOwners[tokenAddr][tokenId];
  }

  function recipientOf(address tokenAddr, uint256 tokenId, bytes32 roleId) external view returns (address) {
    return _roleRecipients[tokenAddr][tokenId][roleId];
  }

  function roleExpirationDate(address tokenAddr, uint256 tokenId, bytes32 roleId) external view returns (uint64) {
    return _roleExpirationDates[tokenAddr][tokenId][roleId];
  }


  
  function isRoleRevocable(address tokenAddr, uint256 tokenId, bytes32 roleId) external view returns (bool) {
    return _roleRevocables[tokenAddr][tokenId][roleId];
  }

  function _isActiveNonRevocable(address tokenAddr, uint256 tokenId, bytes32 roleId) private view returns (bool) {
    address recip = _roleRecipients[tokenAddr][tokenId][roleId];
    if (recip == address(0)) return false;
    return _roleExpirationDates[tokenAddr][tokenId][roleId] > uint64(block.timestamp) && !_roleRevocables[tokenAddr][tokenId][roleId];
  }

  // Governance functions
  function propose(string calldata description) external {
    require(hasProposePermission(msg.sender), "Cannot propose");
    proposals.push(Proposal({description: description, yesVotes: 0, noVotes: 0, executed: false}));
  }

  function vote(uint256 proposalId, bool support) external {
    require(hasVotePermission(msg.sender), "Cannot vote");
    require(proposalId < proposals.length, "Invalid proposal");
    if (support) {
      proposals[proposalId].yesVotes++;
    } else {
      proposals[proposalId].noVotes++;
    }
  }

  function hasProposePermission(address user) public view returns (bool) {
    uint256 tokenId = userTokenId[user];
    if (tokenId == 0) return false;
    address recip = _roleRecipients[membershipNFT][tokenId][PRIMARY_ROLE];
    uint64 exp = _roleExpirationDates[membershipNFT][tokenId][PRIMARY_ROLE];
    return recip == user && exp > uint64(block.timestamp);
  }

  function hasVotePermission(address user) public view returns (bool) {
    uint256 tokenId = userTokenId[user];
    if (tokenId == 0) return false;
    bool isPrimary = _roleRecipients[membershipNFT][tokenId][PRIMARY_ROLE] == user &&
                     _roleExpirationDates[membershipNFT][tokenId][PRIMARY_ROLE] > uint64(block.timestamp);
    bool isSecondary = _roleRecipients[membershipNFT][tokenId][SECONDARY_ROLE] == user &&
                       _roleExpirationDates[membershipNFT][tokenId][SECONDARY_ROLE] > uint64(block.timestamp);
    return isPrimary || isSecondary;
  }
}
  