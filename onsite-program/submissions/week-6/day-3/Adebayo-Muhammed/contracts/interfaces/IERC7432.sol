// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IERC7432 {

    function hasRole(uint256 tokenId, bytes32 role, address user) 
        external view returns (bool);
    

    function grantRole(uint256 tokenId, bytes32 role, address user, uint64 expirationDate) 
        external;
    
 
    function revokeRole(uint256 tokenId, bytes32 role, address user) 
        external;
}