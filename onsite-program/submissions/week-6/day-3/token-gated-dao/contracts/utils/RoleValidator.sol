// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../interfaces/IERC7432.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract RoleValidator {
    
    struct RoleCheck {
        bytes32 role;
        bool required;
        uint256 minimumCount;
    }

    struct TokenRole {
        uint256 tokenId;
        bytes32 role;
        bool active;
        uint64 expiration;
    }

    function hasAnyTokenWithRole(
        address nftContract,
        address account,
        bytes32 role
    ) external view returns (bool) {
        IERC721 nft = IERC721(nftContract);
        IERC7432 roleContract = IERC7432(nftContract);
        
        return _checkRoleForAccount(nft, roleContract, account, role);
    }

    function hasRequiredRoles(
        address nftContract,
        address account,
        RoleCheck[] memory roleChecks
    ) external view returns (bool) {
        IERC721 nft = IERC721(nftContract);
        IERC7432 roleContract = IERC7432(nftContract);

        for (uint256 i = 0; i < roleChecks.length; i++) {
            if (roleChecks[i].required) {
                uint256 roleCount = _countTokensWithRole(nft, roleContract, account, roleChecks[i].role);
                if (roleCount < roleChecks[i].minimumCount) {
                    return false;
                }
            }
        }

        return true;
    }

    function getAllUserRoles(
        address nftContract,
        address account
    ) external view returns (TokenRole[] memory) {
        IERC721 nft = IERC721(nftContract);
        IERC7432 roleContract = IERC7432(nftContract);
        
        uint256 balance = nft.balanceOf(account);
        
        TokenRole[] memory userRoles = new TokenRole[](balance * 5); 
        uint256 roleIndex = 0;

        for (uint256 i = 0; i < balance && roleIndex < userRoles.length; i++) {
            uint256 tokenId = i; 
            
            bytes32[] memory roles = _getDefinedRoles();
            for (uint256 j = 0; j < roles.length; j++) {
                bool hasRole = roleContract.hasRole(roles[j], tokenId);
                uint64 expiration = roleContract.getRoleExpiration(roles[j], tokenId);
                
                if (roleContract.hasRoleAssigned(roles[j], tokenId)) {
                    userRoles[roleIndex] = TokenRole({
                        tokenId: tokenId,
                        role: roles[j],
                        active: hasRole,
                        expiration: expiration
                    });
                    roleIndex++;
                }
            }
        }

        TokenRole[] memory actualRoles = new TokenRole[](roleIndex);
        for (uint256 i = 0; i < roleIndex; i++) {
            actualRoles[i] = userRoles[i];
        }

        return actualRoles;
    }

    function calculateVotingPower(
        address nftContract,
        address account,
        bytes32[] memory powerRoles,
        uint256[] memory roleWeights
    ) external view returns (uint256) {
        require(powerRoles.length == roleWeights.length, "RoleValidator: length mismatch");
        
        IERC721 nft = IERC721(nftContract);
        IERC7432 roleContract = IERC7432(nftContract);
        
        uint256 totalPower = 0;
        
        for (uint256 i = 0; i < powerRoles.length; i++) {
            uint256 roleCount = _countTokensWithRole(nft, roleContract, account, powerRoles[i]);
            totalPower += roleCount * roleWeights[i];
        }
        
        return totalPower;
    }

    function canPerformAction(
        address nftContract,
        address account,
        bytes32 requiredRole,
        uint256 minimumTokens
    ) external view returns (bool) {
        IERC721 nft = IERC721(nftContract);
        IERC7432 roleContract = IERC7432(nftContract);
        
        uint256 validTokens = _countTokensWithRole(nft, roleContract, account, requiredRole);
        return validTokens >= minimumTokens;
    }

    function _checkRoleForAccount(
        IERC721 nft,
        IERC7432 roleContract,
        address account,
        bytes32 role
    ) internal view returns (bool) {
        uint256 balance = nft.balanceOf(account);
        for (uint256 i = 0; i < balance; i++) {
            uint256 tokenId = i;
            
            if (roleContract.hasRole(role, tokenId)) {
                return true;
            }
        }
        
        return false;
    }

    function _countTokensWithRole(
        IERC721 nft,
        IERC7432 roleContract,
        address account,
        bytes32 role
    ) internal view returns (uint256) {
        uint256 balance = nft.balanceOf(account);
        uint256 count = 0;
        
        for (uint256 i = 0; i < balance; i++) {
            uint256 tokenId = i; 
            
            if (roleContract.hasRole(role, tokenId)) {
                count++;
            }
        }
        
        return count;
    }

    function _getDefinedRoles() internal pure returns (bytes32[] memory) {
        bytes32[] memory roles = new bytes32[](5);
        roles[0] = keccak256("VOTER_ROLE");
        roles[1] = keccak256("PROPOSER_ROLE");
        roles[2] = keccak256("ADMIN_ROLE");
        roles[3] = keccak256("TREASURY_ROLE");
        roles[4] = keccak256("VETO_ROLE");
        return roles;
    }
}