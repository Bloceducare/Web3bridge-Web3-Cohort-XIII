// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/ITokenGatedDAO.sol";
import "../interfaces/IRolesRegistry.sol";

contract TokenGatedDAO is ITokenGatedDAO {
    IRolesRegistry public immutable rolesRegistry;
    bytes32 public constant ROLE_PROPOSER = keccak256("DAO_PROPOSER");
    bytes32 public constant ROLE_VOTER = keccak256("DAO_VOTER");

    uint256 public proposalCount;
    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(bytes32 => bool)) public tokenVoted;

    constructor(IRolesRegistry _rolesRegistry) {
        rolesRegistry = _rolesRegistry;
    }

    function propose(
        address[] calldata targets,
        uint256[] calldata values,
        bytes[] calldata calldatas,
        string calldata description,
        address tokenAddress,
        uint256[] calldata tokenIds,
        bytes32 roleId
    ) external override returns (uint256 proposalId) {
        bool allowed = false;
        for (uint i = 0; i < tokenIds.length; i++) {
            if (_tokenHasActiveRole(tokenAddress, tokenIds[i], roleId, msg.sender)) {
                allowed = true;
                break;
            }
        }
        require(allowed, "Not authorized to propose");

        proposalId = ++proposalCount;

        uint64 startBlock = uint64(block.number);
        uint64 endBlock = uint64(block.number + 100);

        proposals[proposalId] = Proposal({
            id: proposalId,
            proposer: msg.sender,
            targets: targets,
            values: values,
            calldatas: calldatas,
            startBlock: startBlock,
            endBlock: endBlock,
            forVotes: 0,
            againstVotes: 0,
            executed: false,
            canceled: false,
            descriptionHash: keccak256(bytes(description))
        });

        emit ProposalCreated(
            proposalId,
            msg.sender,
            targets,
            values,
            calldatas,
            startBlock,
            endBlock,
            description
        );
    }

    function castVoteWithTokens(
        uint256 proposalId,
        bool support,
        address tokenAddress,
        uint256[] calldata tokenIds
    ) external override {
        Proposal storage prop = proposals[proposalId];
        require(block.number >= prop.startBlock && block.number <= prop.endBlock, "Voting closed");

        uint256 weight = 0;
        for (uint i = 0; i < tokenIds.length; i++) {
            bytes32 tokenKey = keccak256(abi.encodePacked(tokenAddress, tokenIds[i]));
            require(!tokenVoted[proposalId][tokenKey], "Token already voted");
            require(_tokenHasActiveRole(tokenAddress, tokenIds[i], ROLE_VOTER, msg.sender), "Not authorized voter");

            tokenVoted[proposalId][tokenKey] = true;
            weight += 1; // could also use rolesRegistry.getRoleWeight(...)
        }

        if (support) {
            prop.forVotes += weight;
        } else {
            prop.againstVotes += weight;
        }

        emit VoteCast(msg.sender, proposalId, support, weight);
    }

    function queue(uint256) external pure override {}
    function execute(uint256) external payable override {}
    function cancel(uint256) external pure override {}

    function state(uint256 proposalId) external view override returns (uint8) {
        Proposal storage prop = proposals[proposalId];
        if (prop.canceled) return 2; // canceled
        if (block.number < prop.startBlock) return 0; // pending
        if (block.number <= prop.endBlock) return 1; // active
        return 3; // finished
    }

    function votingPower(
        address voter,
        address tokenAddress,
        uint256[] calldata tokenIds
    ) external view override returns (uint256) {
        uint256 weight = 0;
        for (uint i = 0; i < tokenIds.length; i++) {
            if (_tokenHasActiveRole(tokenAddress, tokenIds[i], ROLE_VOTER, voter)) {
                weight += 1;
            }
        }
        return weight;
    }

    function _tokenHasActiveRole(
        address tokenAddress,
        uint256 tokenId,
        bytes32 roleId,
        address actor
    ) internal view returns (bool) {
        return rolesRegistry.recipientOf(tokenAddress, tokenId, roleId) == actor &&
               rolesRegistry.roleExpirationDate(tokenAddress, tokenId, roleId) > block.timestamp;
    }
}
