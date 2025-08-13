// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC721Enumerable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import "../interfaces/IERC7432.sol";

contract ZenDAOGovernance is Ownable {
    IERC7432 public roleRegistry;
    ERC721Enumerable public nftContract;

    bytes32 public constant VOTER_ROLE = keccak256("VOTER");
    bytes32 public constant PROPOSER_ROLE = keccak256("PROPOSER");

    struct Proposal {
        address proposer;
        string description;
        uint256 yesVotes;
        uint256 noVotes;
        uint256 deadline;
        bool executed;
        mapping(address => bool) hasVoted;
    }

    mapping(uint256 => Proposal) public proposals;
    uint256 public proposalCount;

    uint256 public constant VOTING_DURATION = 3 days;

    event ProposalCreated(
        uint256 proposalId,
        address proposer,
        string description,
        uint256 deadline
    );
    event Voted(uint256 proposalId, address voter, bool support);
    event ProposalExecuted(uint256 proposalId);
    event RoleGranted(bytes32 role, uint256 tokenId, address grantee);
    event RoleRevoked(bytes32 role, uint256 tokenId, address grantee);

    constructor(
        address _nftContract,
        address _roleRegistry,
        address initialOwner
    ) Ownable(initialOwner) {
        nftContract = ERC721Enumerable(_nftContract);
        roleRegistry = IERC7432(_roleRegistry);
    }

    function grantVoterRole(
        uint256 _tokenId,
        address _grantee,
        uint64 _expirationDate,
        bytes calldata _data
    ) external onlyOwner {
        roleRegistry.grantRole(
            VOTER_ROLE,
            address(nftContract),
            _tokenId,
            _grantee,
            _expirationDate,
            _data
        );
        emit RoleGranted(VOTER_ROLE, _tokenId, _grantee);
    }

    function grantProposerRole(
        uint256 _tokenId,
        address _grantee,
        uint64 _expirationDate,
        bytes calldata _data
    ) external onlyOwner {
        roleRegistry.grantRole(
            PROPOSER_ROLE,
            address(nftContract),
            _tokenId,
            _grantee,
            _expirationDate,
            _data
        );
        emit RoleGranted(PROPOSER_ROLE, _tokenId, _grantee);
    }

    function revokeVoterRole(
        uint256 _tokenId,
        address _grantee
    ) external onlyOwner {
        roleRegistry.revokeRole(
            VOTER_ROLE,
            address(nftContract),
            _tokenId,
            _grantee
        );
        emit RoleRevoked(VOTER_ROLE, _tokenId, _grantee);
    }

    function revokeProposerRole(
        uint256 _tokenId,
        address _grantee
    ) external onlyOwner {
        roleRegistry.revokeRole(
            PROPOSER_ROLE,
            address(nftContract),
            _tokenId,
            _grantee
        );
        emit RoleRevoked(PROPOSER_ROLE, _tokenId, _grantee);
    }

    function createProposal(string memory _description) external {
        require(nftContract.balanceOf(msg.sender) > 0, "Must own NFT");
        uint256 tokenId = getTokenId(msg.sender);
        require(
            roleRegistry.hasRole(
                PROPOSER_ROLE,
                address(nftContract),
                tokenId,
                address(this),
                msg.sender
            ),
            "Must have Proposer role"
        );

        Proposal storage proposal = proposals[proposalCount];
        proposal.proposer = msg.sender;
        proposal.description = _description;
        proposal.deadline = block.timestamp + VOTING_DURATION;
        proposal.executed = false;

        emit ProposalCreated(
            proposalCount,
            msg.sender,
            _description,
            proposal.deadline
        );
        proposalCount++;
    }

    function vote(uint256 _proposalId, bool _support) external {
        require(nftContract.balanceOf(msg.sender) > 0, "Must own NFT");
        uint256 tokenId = getTokenId(msg.sender);
        require(
            roleRegistry.hasRole(
                VOTER_ROLE,
                address(nftContract),
                tokenId,
                address(this),
                msg.sender
            ),
            "Must have Voter role"
        );
        Proposal storage proposal = proposals[_proposalId];
        require(block.timestamp <= proposal.deadline, "Voting closed");
        require(!proposal.hasVoted[msg.sender], "Already voted");

        proposal.hasVoted[msg.sender] = true;
        if (_support) {
            proposal.yesVotes++;
        } else {
            proposal.noVotes++;
        }

        emit Voted(_proposalId, msg.sender, _support);
    }

    function executeProposal(uint256 _proposalId) external onlyOwner {
        Proposal storage proposal = proposals[_proposalId];
        require(block.timestamp > proposal.deadline, "Voting not finished");
        require(!proposal.executed, "Already executed");
        require(proposal.yesVotes > proposal.noVotes, "Proposal rejected");

        proposal.executed = true;
        emit ProposalExecuted(_proposalId);
    }

    function getTokenId(address _owner) internal view returns (uint256) {
        uint256 tokenId = nftContract.tokenOfOwnerByIndex(_owner, 0);
        require(
            nftContract.ownerOf(tokenId) == msg.sender,
            "Invalid token ownership"
        );

        return tokenId;
    }
}
