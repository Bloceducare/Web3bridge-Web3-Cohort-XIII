// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "./interfaces/IERC7432.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract RoleGatedDAO {
    address public immutable roleNftContract;
    address public immutable roles;

    bytes32 public constant PROPOSER_ROLE = keccak256("PROPOSER");
    bytes32 public constant VOTER_ROLE = keccak256("VOTER");
    bytes32 public constant DAO_ROLE = keccak256("DAO_MEMBER");

    struct Proposal {
        string description;
        uint256 yesVotes;
        uint256 noVotes;
        bool executed;
        mapping(address => bool) voted;
    }

    Proposal[] public proposals;

    constructor(address _roleNftContract, address _roles) {
        roleNftContract = _roleNftContract;
        roles = _roles;
    }

    function proposalRole(uint256 tokenId, string memory description) external {
        bool hasPropRole = IERC7432(roles).hasRole(PROPOSER_ROLE, roleNftContract, tokenId, msg.sender, msg.sender);
        bool hasDaoRole = IERC7432(roles).hasRole(DAO_ROLE, roleNftContract, tokenId, msg.sender, msg.sender);
        if (!hasPropRole && !hasDaoRole) {
            revert("No proposer or DAO role");
        }

        proposals.push();
        uint256 proposalId = proposals.length - 1;
        Proposal storage prop = proposals[proposalId];
        prop.description = description;
    }

    function voteRole(uint256 proposalId, uint256 tokenId, bool support) external {
        Proposal storage prop = proposals[proposalId];
        if (prop.executed) {
            revert("Proposal executed");
        }

        bool hasVoteRole = IERC7432(roles).hasRole(VOTER_ROLE, roleNftContract, tokenId, msg.sender, msg.sender);
        bool hasDaoRole = IERC7432(roles).hasRole(DAO_ROLE, roleNftContract, tokenId, msg.sender, msg.sender);
        if (!hasVoteRole && !hasDaoRole) {
            revert("No voter or DAO role");
        }

        if (prop.voted[msg.sender]) {
            revert("Already voted");
        }

        prop.voted[msg.sender] = true;
        if (support) {
            prop.yesVotes += 1;
        } else {
            prop.noVotes += 1;
        }
    }

    function accessDAORole(uint256 tokenId) external view returns (bool) {
        return IERC7432(roles).hasRole(DAO_ROLE, roleNftContract, tokenId, msg.sender, msg.sender);
    }
}