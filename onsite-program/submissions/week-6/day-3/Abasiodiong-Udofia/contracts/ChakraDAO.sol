// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./interfaces/IChakraRoleRegistry.sol";

contract ChakraDAO {
    address public immutable nftAddress;
    address public immutable roleRegistry;
    bytes32 public constant MEMBER_ROLE = keccak256("MEMBER");

    struct Proposal {
        string description;
        uint256 yesVotes;
        uint256 noVotes;
        bool executed;
        mapping(address => bool) voted;
    }

    mapping(uint256 => Proposal) public proposals;
    uint256 public nextProposalId;

    event ProposalCreated(uint256 indexed proposalId, address indexed proposer, string description);
    event Voted(uint256 indexed proposalId, address indexed voter, bool support);

    constructor(address _nftAddress, address _roleRegistry) {
        require(_nftAddress != address(0), "NFT address cannot be zero");
        require(_roleRegistry != address(0), "Role registry cannot be zero");
        nftAddress = _nftAddress;
        roleRegistry = _roleRegistry;
    }

    function propose(uint256 tokenId, string memory description) external {
        require(bytes(description).length > 0, "Description cannot be empty");

        address recipient = IChakraRoleRegistry(roleRegistry).recipientOf(nftAddress, tokenId, MEMBER_ROLE);
        require(recipient == msg.sender, "Not a member");
        require(
            IChakraRoleRegistry(roleRegistry).roleExpirationDate(nftAddress, tokenId, MEMBER_ROLE) > block.timestamp,
            "Membership expired"
        );

        uint256 proposalId = nextProposalId++;
        proposals[proposalId].description = description;

        emit ProposalCreated(proposalId, msg.sender, description);
    }

    function vote(uint256 proposalId, uint256 tokenId, bool support) external {
        Proposal storage prop = proposals[proposalId];
        require(!prop.executed, "Proposal already executed");
        require(!prop.voted[msg.sender], "Already voted");

        address recipient = IChakraRoleRegistry(roleRegistry).recipientOf(nftAddress, tokenId, MEMBER_ROLE);
        require(recipient == msg.sender, "Not a member");
        require(
            IChakraRoleRegistry(roleRegistry).roleExpirationDate(nftAddress, tokenId, MEMBER_ROLE) > block.timestamp,
            "Membership expired"
        );

        if (support) {
            prop.yesVotes++;
        } else {
            prop.noVotes++;
        }

        prop.voted[msg.sender] = true;

        emit Voted(proposalId, msg.sender, support);
    }

    function execute1(uint256 proposalId) external {
    require(proposalId < nextProposalId, "Invalid proposal");
    Proposal storage prop = proposals[proposalId];
    require(!prop.executed, "Already executed");
    require(prop.yesVotes > prop.noVotes, "Proposal not approved");
    

    prop.executed = true;

}

}