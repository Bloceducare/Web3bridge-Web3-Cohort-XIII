// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interface/IERC7432.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract TokenGatedDAO {
    IERC7432 public roles;
    address  public membership; // ERC-721 token address used for roles

    bytes32 public constant ROLE_PROPOSER = keccak256("PROPOSER");
    bytes32 public constant ROLE_VOTER    = keccak256("VOTER");
    bytes32 public constant ROLE_RESOURCE = keccak256("RESOURCE");

    struct Proposal {
        string description;
        uint64 end;
        uint256 forVotes;
        uint256 againstVotes;
        bool executed;
    }

    uint256 public nextProposal;
    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => bool)) public voted;

    event ProposalCreated(uint256 id, address proposer, string desc, uint64 end);
    event Voted(uint256 id, address voter, bool support);
    event Executed(uint256 id, bool passed);

    constructor(address _roles, address _membership) {
        roles = IERC7432(_roles);
        membership = _membership;
    }

    // internal helper: who is the owner (grantor) of tokenId (we assume owner is grantor)
    function _grantorOf(uint256 tokenId) internal view returns (address) {
        return IERC721(membership).ownerOf(tokenId);
    }

    // check if `user` has `roleId` on tokenId (granted by owner of tokenId)
    function _hasRole(address user, uint256 tokenId, bytes32 roleId) internal view returns (bool) {
        address grantor = _grantorOf(tokenId);
        return roles.hasRole(roleId, membership, tokenId, grantor, user);
    }


    function propose(string calldata description, uint256 tokenId) external {
        require(_hasRole(msg.sender, tokenId, ROLE_PROPOSER), "need proposer role on tokenId");
        uint64 end = uint64(block.timestamp + 120);
        proposals[nextProposal] = Proposal(description, end, 0, 0, false);
        emit ProposalCreated(nextProposal, msg.sender, description, end);
        nextProposal++;
    }

    function vote(uint256 proposalId, bool support, uint256 tokenId) external {
        require(_hasRole(msg.sender, tokenId, ROLE_VOTER), "need voter role");
        Proposal storage p = proposals[proposalId];
        require(block.timestamp < p.end, "voting closed");
        require(!voted[proposalId][msg.sender], "already voted");

        voted[proposalId][msg.sender] = true;
        if (support) p.forVotes++;
        else p.againstVotes++;

        emit Voted(proposalId, msg.sender, support);
    }


    // helper to stringify bytes32 for demo output
    function _toHex(bytes32 data) internal pure returns (string memory) {
        bytes16 HEX = "0123456789abcdef";
        bytes memory str = new bytes(64);
        for (uint i = 0; i < 32; i++) {
            str[2*i]   = HEX[uint8(data[i] >> 4)];
            str[2*i+1] = HEX[uint8(data[i] & 0x0f)];
        }
        return string(str);
    }
}
