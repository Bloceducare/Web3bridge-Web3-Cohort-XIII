// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";

interface IERC7432 {
    function recipientOf(address tokenAddress, uint256 tokenId, bytes32 roleId) external view returns (address);
    function roleExpirationDate(address tokenAddress, uint256 tokenId, bytes32 roleId) external view returns (uint64);
}

contract RoleGatedGovernor is Governor, GovernorSettings, GovernorCountingSimple {
    address public immutable nftAddress;
    address public immutable rolesRegistry;
    bytes32 public constant VOTER_ROLE = keccak256(abi.encodePacked("VOTER"));

    constructor(address _nftAddress, address _rolesRegistry)
        Governor("RoleGatedGovernor")
        GovernorSettings(1 /* 1 block delay */, 45818 /* ~1 week */, 0)
    {
        nftAddress = _nftAddress;
        rolesRegistry = _rolesRegistry;
    }

    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description,
        uint256 tokenId
    ) public returns (uint256) {
        _checkActiveRole(msg.sender, tokenId);
        return super.propose(targets, values, calldatas, description);
    }

    function castVoteWithReasonAndParams(
        uint256 proposalId,
        uint8 support,
        string calldata reason,
        bytes calldata params,
        uint256 tokenId
    ) external returns (uint256 balance) {
        _checkActiveRole(msg.sender, tokenId);
        return _castVote(proposalId, msg.sender, support, reason, params);
    }

    function _checkActiveRole(address account, uint256 tokenId) internal view {
        address recipient = IERC7432(rolesRegistry).recipientOf(nftAddress, tokenId, VOTER_ROLE);
        require(recipient != address(0), "Role not assigned");
        require(recipient == account, "Not role recipient");
        require(
            IERC7432(rolesRegistry).roleExpirationDate(nftAddress, tokenId, VOTER_ROLE) > uint64(block.timestamp),
            "Role expired"
        );
    }

    function _getVotes(
        address account,
        uint256 timepoint,
        bytes memory params
    ) internal view virtual override returns (uint256) {
        return 1; // 1 vote per valid role
    }

    function quorum(uint256) public pure override returns (uint256) {
        return 4; // Example quorum
    }

    function proposalThreshold() public view override(Governor, GovernorSettings) returns (uint256) {
        return super.proposalThreshold();
    }

    // IERC6372 implementations
    function clock() public view virtual override returns (uint48) {
        return uint48(block.number);
    }

    function CLOCK_MODE() public view virtual override returns (string memory) {
        return "mode=blocknumber";
    }
}