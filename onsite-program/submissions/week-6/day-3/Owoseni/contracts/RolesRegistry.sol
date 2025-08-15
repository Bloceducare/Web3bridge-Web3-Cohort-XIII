//SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Enumerable.sol";

interface IRolesRegistry {
    function hasValidRole(address _collection, uint256 _tokenId, bytes32 _role, address _grantee) external view returns (bool);
}

abstract contract TokenGatedDAO is Governor, GovernorSettings, GovernorCountingSimple {
    address public immutable nftCollection;
    IRolesRegistry public immutable rolesRegistry;
    bytes32 public constant VOTER_ROLE = keccak256("VOTER");
    bytes32 public constant PROPOSER_ROLE = keccak256("PROPOSER");

    constructor(address _nftCollection, address _rolesRegistry)
        Governor("TokenGatedDAO")
        GovernorSettings(1 /* 1 block delay */, 45818 /* ~1 week */, 1) // Adjust as needed
        GovernorCountingSimple()
    {
        require(_nftCollection != address(0) && _rolesRegistry != address(0), "Invalid addresses");
        nftCollection = _nftCollection;
        rolesRegistry = IRolesRegistry(_rolesRegistry);
    }

    // Override to check VOTER role instead of token balance
    function _getVotes(address account, uint256 /* blockNumber */, bytes memory) internal view override(Governor) returns (uint256) {
        uint256 balance = IERC721Enumerable(nftCollection).balanceOf(account);
        uint256 votes = 0;

        // Loop through owned NFTs to check for VOTER role
        for (uint256 i = 0; i < balance; i++) {
            uint256 tokenId = IERC721Enumerable(nftCollection).tokenOfOwnerByIndex(account, i);
            if (rolesRegistry.hasValidRole(nftCollection, tokenId, VOTER_ROLE, account)) {
                votes += 1; // One vote per valid role
            }
        }
        return votes;
    }

    // Override to gate proposals with PROPOSER role
    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    ) public override returns (uint256) {
        require(_hasRole(msg.sender, PROPOSER_ROLE), "Missing PROPOSER role");
        return super.propose(targets, values, calldatas, description);
    }

    // Helper to check if user has a role on any owned NFT
    function _hasRole(address account, bytes32 role) internal view returns (bool) {
        uint256 balance = IERC721Enumerable(nftCollection).balanceOf(account);
        for (uint256 i = 0; i < balance; i++) {
            uint256 tokenId = IERC721Enumerable(nftCollection).tokenOfOwnerByIndex(account, i);
            if (rolesRegistry.hasValidRole(nftCollection, tokenId, role, account)) {
                return true;
            }
        }
        return false;
    }

    // Required overrides
    function votingDelay() public view override(Governor, GovernorSettings) returns (uint256) {
        return super.votingDelay();
    }

    function votingPeriod() public view override(Governor, GovernorSettings) returns (uint256) {
        return super.votingPeriod();
    }

    function quorum(uint256) public pure override returns (uint256) {
        return 1; // Adjust as needed
    }

    function proposalThreshold() public view override(Governor, GovernorSettings) returns (uint256) {
        return super.proposalThreshold();
    }
}