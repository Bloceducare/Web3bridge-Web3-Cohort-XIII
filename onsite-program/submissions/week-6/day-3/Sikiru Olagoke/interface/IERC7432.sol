//SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title ERC-7432 Non-Fungible Token Roles
/// @dev See https://eips.ethereum.org/EIPS/eip-7432
/// Note: the ERC-165 identifier for this interface is 0xd00ca5cf.
interface IERC7432 /* is ERC165 */ {


  struct Role {
    bytes32 roleId;
    address tokenAddress;
    uint256 tokenId;
    address recipient;
  }


  /** External Functions **/

  /// @notice Grants a role to a user.
  /// @dev Reverts if sender is not approved or the NFT owner.
  function grantRole(
    address tokenAddress,
    uint256 tokenId,
    address recipient
  ) external;

  /// @notice Revokes a role from a user.
  /// @dev Reverts if sender is not approved or the original owner.
  /// @param _tokenAddress The token address.
  /// @param _tokenId The token identifier.
  
  function revokeRole(address _tokenAddress, uint256 _tokenId) external;



  /** View Functions **/

  /// @notice Retrieves the original owner of the NFT.
  /// @param _tokenAddress The token address.
  /// @param _tokenId The token identifier.
  /// @return owner_ The owner of the token.
  function ownerOf(address _tokenAddress, uint256 _tokenId) external view returns (address owner_);

  /// @notice Retrieves the recipient of an NFT role.
  /// @param _tokenAddress The token address.
  /// @param _tokenId The token identifier.
  /// @return recipient_ The user that received the role.
  function recipientOf(
    address _tokenAddress,
    uint256 _tokenId
  ) external view returns (address recipient_);



}
