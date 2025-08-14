// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/ITokenGatedDAO.sol";
import "./interfaces/IRolesRegistry.sol";

contract TokenGatedDAO is ITokenGatedDAO {
    // Grouped related state variables
    struct ProposalData {
        uint256 id;
        address proposer;
        uint64 startBlock;
        uint64 endBlock;
        uint256 forVotes;
        uint256 againstVotes;
        bool executed;
        bool canceled;
        bytes32 descriptionHash;
    }
    
    struct ProposalExecution {
        address[] targets;
        uint256[] values;
        bytes[] calldatas;
    }

    IRolesRegistry public immutable rolesRegistry;
    bytes32 public constant ROLE_PROPOSER = keccak256("DAO_PROPOSER");
    bytes32 public constant ROLE_VOTER = keccak256("DAO_VOTER");

    uint256 public proposalCount;
    mapping(uint256 => ProposalData) public proposalsData;
    mapping(uint256 => ProposalExecution) internal _proposalsExecution;
    mapping(uint256 => mapping(bytes32 => bool)) public tokenVoted;

    constructor(IRolesRegistry _rolesRegistry) {
        rolesRegistry = _rolesRegistry;
    }

    function _tokenHasActiveRole(
        address tokenAddress,
        uint256 tokenId,
        bytes32 roleId,
        address account
    ) internal view returns (bool) {
        try rolesRegistry.recipientOf(tokenAddress, tokenId, roleId) returns (address recipient) {
            return recipient == account && block.timestamp < rolesRegistry.roleExpirationDate(tokenAddress, tokenId, roleId);
        } catch {
            return false;
        }
    }

    function _hasAnyTokenWithRole(
        address tokenAddress,
        uint256[] calldata tokenIds,
        bytes32 roleId,
        address account
    ) internal view returns (bool) {
        for (uint i = 0; i < tokenIds.length; i++) {
            if (_tokenHasActiveRole(tokenAddress, tokenIds[i], roleId, account)) {
                return true;
            }
        }
        return false;
    }

    function _createProposalData(
        uint256 proposalId,
        address proposer,
        string calldata description,
        uint64 startBlock,
        uint64 endBlock
    ) internal pure returns (ProposalData memory) {
        return ProposalData({
            id: proposalId,
            proposer: proposer,
            startBlock: startBlock,
            endBlock: endBlock,
            forVotes: 0,
            againstVotes: 0,
            executed: false,
            canceled: false,
            descriptionHash: keccak256(bytes(description))
        });
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
        require(_hasAnyTokenWithRole(tokenAddress, tokenIds, roleId, msg.sender), "Not authorized to propose");

        proposalId = ++proposalCount;
        uint64 startBlock = uint64(block.number);
        uint64 endBlock = uint64(block.number + 100);

        // Store data in separate mappings
        proposalsData[proposalId] = _createProposalData(
            proposalId,
            msg.sender,
            description,
            startBlock,
            endBlock
        );
        
        _proposalsExecution[proposalId] = ProposalExecution({
            targets: targets,
            values: values,
            calldatas: calldatas
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
        ProposalData storage prop = proposalsData[proposalId];
        require(block.number >= prop.startBlock && block.number <= prop.endBlock, "Voting closed");

        uint256 weight = 0;
        for (uint i = 0; i < tokenIds.length; i++) {
            bytes32 tokenKey = keccak256(abi.encodePacked(tokenAddress, tokenIds[i]));
            require(!tokenVoted[proposalId][tokenKey], "Token already voted");
            require(_tokenHasActiveRole(tokenAddress, tokenIds[i], ROLE_VOTER, msg.sender), "Not authorized voter");

            tokenVoted[proposalId][tokenKey] = true;
            weight++;
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
        ProposalData storage prop = proposalsData[proposalId];
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
                weight++;
            }
        }
        return weight;
    }

    function getProposalTargets(uint256 proposalId) external view returns (address[] memory) {
        return _proposalsExecution[proposalId].targets;
    }
    
    function getProposalValues(uint256 proposalId) external view returns (uint256[] memory) {
        return _proposalsExecution[proposalId].values;
    }
    
    function getProposalCalldatas(uint256 proposalId) external view returns (bytes[] memory) {
        return _proposalsExecution[proposalId].calldatas;
    }
}
