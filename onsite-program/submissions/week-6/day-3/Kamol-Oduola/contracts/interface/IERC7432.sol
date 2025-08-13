//SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import { IERC165 } from "@openzeppelin/contracts/utils/introspection/IERC165.sol";

interface IERC7432 is IERC165 {
    
    struct RoleData {
        uint64 expirationDate;
        bytes data;
    }

    event RoleGranted(
        bytes32 indexed _role,
        address indexed _tokenAddress,
        uint256 indexed _tokenId,
        address _grantee,
        uint64  _expirationDate,
        bytes _data
    );

    event RoleRevoked(
        bytes32 indexed _role,
        address indexed _tokenAddress,
        uint256 indexed _tokenId,
        address _grantee
    );

    function grantRole(
        bytes32 _role,
        address _tokenAddress,
        uint256 _tokenId,
        address _grantee,
        uint64 _expirationDate,
        bytes calldata _data
    ) external;

    function revokeRole(
        bytes32 _role,
        address _tokenAddress,
        uint256 _tokenId,
        address _grantee
    ) external;

    function hasRole(
        bytes32 _role,
        address _tokenAddress,
        uint256 _tokenId,
        address _grantor,
        address _grantee
    ) external view returns (bool);

    function hasUniqueRole(
      bytes32 _role,
      address _tokenAddress,
      uint256 _tokenId,
      address _grantor,
      address _grantee
    ) external view returns (bool);

    function roleData(
        bytes32 _role,
        address _tokenAddress,
        uint256 _tokenId,
        address _grantor,
        address _grantee
    ) external view returns (bytes memory data_);

    function roleExpirationDate(
        bytes32 _role,
        address _tokenAddress,
        uint256 _tokenId,
        address _grantor,
        address _grantee
    ) external view returns (uint64 expirationDate_);

}
