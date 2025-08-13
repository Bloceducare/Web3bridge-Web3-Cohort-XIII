// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./RoleNFT.sol";

contract TokenGatedDAO {
    RoleNFT public roleNFT;

    constructor(address _roleNFT) {
        roleNFT = RoleNFT(_roleNFT);
    }

    modifier onlyRole(uint256 tokenId, string memory role) {
        require(roleNFT.hasRole(tokenId, role), "Access denied");
        _;
    }

    function submitProposal(uint256 tokenId, string memory proposalData) external onlyRole(tokenId, "PROPOSER") {
        
    }

    function vote(uint256 tokenId, uint256 proposalId, bool support) external onlyRole(tokenId, "VOTER") {
    
    }
}
