//SPDX-License-Identifier: UNLICENSED 

pragma solidity 0.8.26;

interface IERC7432{
  struct Role {
    bytes32 roleId;
    address tokenAddress;
    uint256 tokenId;
    address recipient;
    uint64 expirationDate;
    bool revocable;
    bytes data;
  }

  /** Events **/

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

  /** External Functions **/

  function grantRole(Role calldata _role) external;


  function revokeRole(address _tokenAddress, uint256 _tokenId, bytes32 _roleId) external;


  function unlockToken(address _tokenAddress, uint256 _tokenId) external;


  // function setRoleApprovalForAll(address _tokenAddress, address _operator, bool _approved) external;

  /** View Functions **/

  function ownerOf(address _tokenAddress, uint256 _tokenId) external view returns (address owner_);


  function recipientOf(
    address _tokenAddress,
    uint256 _tokenId,
    bytes32 _roleId
  ) external view returns (address recipient_);


  // function roleData(
  //   address _tokenAddress,
  //   uint256 _tokenId,
  //   bytes32 _roleId
  // ) external view returns (bytes memory data_);


  // function roleExpirationDate(
  //   address _tokenAddress,
  //   uint256 _tokenId,
  //   bytes32 _roleId
  // ) external view returns (uint64 expirationDate_);

  // function isRoleRevocable(
  //   address _tokenAddress,
  //   uint256 _tokenId,
  //   bytes32 _roleId
  // ) external view returns (bool revocable_);

  // function isRoleApprovedForAll(
  //   address _tokenAddress,
  //   address _owner,
  //   address _operator
  // ) external view returns (bool);
}