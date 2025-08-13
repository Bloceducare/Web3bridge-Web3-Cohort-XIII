// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IERC7432 {
  struct Role {
    bytes32 roleId;
    address tokenAddress;
    uint256 tokenId;
    address recipient;
    uint64 expirationDate;
    bool revocable;
    bytes data;
  }


  function grantRole(Role calldata _role) external;

  /// @notice Revokes a role from a user.
  /// @dev Reverts if sender is not approved or the original owner.
  /// @param _tokenAddress The token address.
  /// @param _tokenId The token identifier.
  /// @param _roleId The role identifier.
  function revokeRole(address _tokenAddress, uint256 _tokenId, bytes32 _roleId) external;

  /// @notice Unlocks NFT (transfer back to original owner or unfreeze it).
  /// @dev Reverts if sender is not approved or the original owner.
  /// @param _tokenAddress The token address.
  /// @param _tokenId The token identifier.
  function unlockToken(address _tokenAddress, uint256 _tokenId) external;


  /** View Functions **/

  /// @notice Retrieves the original owner of the NFT.
  /// @param _tokenAddress The token address.
  /// @param _tokenId The token identifier.
  /// @return owner_ The owner of the token.
  function ownerOf(address _tokenAddress, uint256 _tokenId) external view returns (address owner_);

  /// @notice Retrieves the recipient of an NFT role.
  /// @param _tokenAddress The token address.
  /// @param _tokenId The token identifier.
  /// @param _roleId The role identifier.
  /// @return recipient_ The user that received the role.
  function recipientOf(
    address _tokenAddress,
    uint256 _tokenId,
    bytes32 _roleId
  ) external view returns (address recipient_);

  /// @notice Retrieves the custom data of a role assignment.
  /// @param _tokenAddress The token address.
  /// @param _tokenId The token identifier.
  /// @param _roleId The role identifier.
  /// @return data_ The custom data of the role.
  function roleData(
    address _tokenAddress,
    uint256 _tokenId,
    bytes32 _roleId
  ) external view returns (bytes memory data_);

  /// @notice Retrieves the expiration date of a role assignment.
  /// @param _tokenAddress The token address.
  /// @param _tokenId The token identifier.
  /// @param _roleId The role identifier.
  /// @return expirationDate_ The expiration date of the role.
  function roleExpirationDate(
    address _tokenAddress,
    uint256 _tokenId,
    bytes32 _roleId
  ) external view returns (uint64 expirationDate_);

  /// @notice Verifies whether the role is revocable.
  /// @param _tokenAddress The token address.
  /// @param _tokenId The token identifier.
  /// @param _roleId The role identifier.
  /// @return revocable_ Whether the role is revocable.
  function isRoleRevocable(
    address _tokenAddress,
    uint256 _tokenId,
    bytes32 _roleId
  ) external view returns (bool revocable_);

  /// @notice Verifies if the owner approved the operator.
  /// @param _tokenAddress The token address.
  /// @param _owner The user that approved the operator.
  /// @param _operator The user that can grant and revoke roles.
  /// @return Whether the operator is approved.
  function isRoleApprovedForAll(
    address _tokenAddress,
    address _owner,
    address _operator
  ) external view returns (bool);
}



}