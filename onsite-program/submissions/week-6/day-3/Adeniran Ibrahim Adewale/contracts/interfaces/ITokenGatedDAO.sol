// contracts/interfaces/ITokenGatedDAO.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ITokenGatedDAO {
    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        address[] targets,
        uint256[] values,
        bytes[] calldatas,
        uint64 startBlock,
        uint64 endBlock,
        string description
    );

    event VoteCast(
        address indexed voter,
        uint256 indexed proposalId,
        bool support,
        uint256 weight
    );

    function propose(
        address[] calldata targets,
        uint256[] calldata values,
        bytes[] calldata calldatas,
        string calldata description,
        address tokenAddress,
        uint256[] calldata tokenIds,
        bytes32 roleId
    ) external returns (uint256 proposalId);

    function castVoteWithTokens(
        uint256 proposalId,
        bool support,
        address tokenAddress,
        uint256[] calldata tokenIds
    ) external;

    function queue(uint256 proposalId) external;
    function execute(uint256 proposalId) external payable;
    function cancel(uint256 proposalId) external;

    function state(uint256 proposalId) external view returns (uint8);
    function votingPower(
        address voter,
        address tokenAddress,
        uint256[] calldata tokenIds
    ) external view returns (uint256);
}
