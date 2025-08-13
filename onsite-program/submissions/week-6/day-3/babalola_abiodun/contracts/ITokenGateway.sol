// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface ITokenGateway{
    struct Role {
        bytes32 roleId;
        address tokenAddress;
        uint256 tokenId;
        address recipient;
        uint64 expirationDate;
        bool revocable;
        bytes data;
    }

    function mint(address userCreated, string memory roleId, bool isRecovable, bytes memory data)external;
    function isUser(address userAddress) external returns(bool);
    function revokeUserRole(address userAddress) external returns(bool);
    event TokenUnlocked(address indexed _owner, address indexed _tokenAddress, uint256 indexed _tokenId);
    event TokenLocked(address indexed _owner, address indexed _tokenAddress, uint256 _tokenId);
    function grantRole(Role calldata _role) external;
    function setRoleApprovalForAll(address _tokenAddress, address _operator, bool _approved) external;
    function unlockToken(address userAddress) external;

}