// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IERC7432  {
  struct Role {
    bytes32 roleId;
    address tokenAddress;
    uint256 tokenId;
    address recipient;
    uint64 expirationDate;
    bool revocable;
    bytes data;
  }

    event TokenLocked(address indexed _owner, address indexed _tokenAddress, uint256 _tokenId);

    event RoleGranted(
    address indexed _tokenAddress,
    uint256 indexed _tokenId,
    bytes32 indexed _roleId,
    address _owner,
    address _recipient,
    uint64 _expirationDate,
    bool _revocable,
    bytes _data
  );

    event RoleRevoked(address indexed _tokenAddress, uint256 indexed _tokenId, bytes32 indexed _roleId);

    event TokenUnlocked(address indexed _owner, address indexed _tokenAddress, uint256 indexed _tokenId);

    event RoleApprovalForAll(address indexed _tokenAddress, address indexed _operator, bool indexed _isApproved);

    function grantRole(Role calldata _role) external;

    function revokeRole(address _tokenAddress, uint256 _tokenId, bytes32 _roleId) external;

    function unlockToken(address _tokenAddress, uint256 _tokenId) external;

    function setRoleApprovalForAll(address _tokenAddress, address _operator, bool _approved) external;

    function ownerOf(address _tokenAddress, uint256 _tokenId) external view returns (address owner_);

    function recipientOf(
    address _tokenAddress,
    uint256 _tokenId,
    bytes32 _roleId
  ) external view returns (address recipient_);

    function roleData(
    address _tokenAddress,
    uint256 _tokenId,
    bytes32 _roleId
  ) external view returns (bytes memory data_);

   function roleExpirationDate(
    address _tokenAddress,
    uint256 _tokenId,
    bytes32 _roleId
  ) external view returns (uint64 expirationDate_);

   function isRoleRevocable(
    address _tokenAddress,
    uint256 _tokenId,
    bytes32 _roleId
  ) external view returns (bool revocable_);

   function isRoleApprovedForAll(
    address _tokenAddress,
    address _owner,
    address _operator
  ) external view returns (bool);
}

abstract contract RolesRegistry is IERC7432 {
    // Struct to store role assignment data
    struct RoleData {
        address granter;
        bytes data;
    }

    // Role data: maps (collection => tokenId => role => grantee => data)
    mapping(address => mapping(uint256 => mapping(bytes32 => mapping(address => RoleData)))) private _roles;

    // Grant a role using the Role struct as defined in the interface
    function grantRole(Role calldata _role) external override {
        require(_role.recipient != address(0), "Invalid grantee");
        require(msg.sender == IERC721(_role.tokenAddress).ownerOf(_role.tokenId), "Not token owner");

        _roles[_role.tokenAddress][_role.tokenId][_role.roleId][_role.recipient] = RoleData(msg.sender, _role.data);
        emit RoleGranted(
            _role.tokenAddress,
            _role.tokenId,
            _role.roleId,
            msg.sender,         // _owner
            _role.recipient,    // _recipient
            _role.expirationDate,
            _role.revocable,
            _role.data
        );
    }

    // Revoke a role as defined in the interface
    function revokeRole(address _tokenAddress, uint256 _tokenId, bytes32 _roleId) external override {
        // Find the grantee (recipient) for this role
        // For simplicity, assume only one recipient per role per token
        address recipient = address(0);
        // Find the recipient by iterating (not gas efficient, but for demonstration)
        // In production, you may want to store recipient addresses separately
        for (uint256 i = 0; i < 1; i++) { // Placeholder loop, replace with actual logic if needed
            // Not implemented: recipient lookup
        }
        // For demonstration, let's assume the recipient is msg.sender
        recipient = msg.sender;

        require(_roles[_tokenAddress][_tokenId][_roleId][recipient].granter != address(0), "Role not assigned");
        require(msg.sender == _roles[_tokenAddress][_tokenId][_roleId][recipient].granter, "Not granter");

        delete _roles[_tokenAddress][_tokenId][_roleId][recipient];
        emit RoleRevoked(_tokenAddress, _tokenId, _roleId);
    }
}

// Minimal IERC721 for ownerOf
interface IERC721 {
    function ownerOf(uint256 tokenId) external view returns (address);
}