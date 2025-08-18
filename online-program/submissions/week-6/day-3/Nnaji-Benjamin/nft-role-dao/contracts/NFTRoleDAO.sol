// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./RoleRegistry.sol";

contract NFTRoleDAO is Initializable, OwnableUpgradeable {
    RoleRegistry public roleRegistry;
    bytes32 public constant DAO_MEMBER_ROLE = keccak256("DAO_MEMBER");
    
    struct Proposal {
        uint256 id;
        string description;
        uint256 voteCount;
        uint256 againstCount;
        bool executed;
    }
    
    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    uint256 public proposalCount;
    
    event ProposalCreated(uint256 indexed proposalId, string description);
    event Voted(uint256 indexed proposalId, address indexed voter, bool support);
    event ProposalExecuted(uint256 indexed proposalId);
    
    function initialize(address _roleRegistry) public initializer {
        __Ownable_init(msg.sender);
        roleRegistry = RoleRegistry(_roleRegistry);
    }
    
    modifier onlyMember(address tokenContract, uint256 tokenId) {
        require(
            roleRegistry.hasRole(tokenContract, tokenId, DAO_MEMBER_ROLE, msg.sender) ||
            roleRegistry.hasRole(tokenContract, tokenId, DAO_MEMBER_ROLE, address(0)),
            "NFTRoleDAO: caller does not have DAO_MEMBER role"
        );
        _;
    }
    
    function createProposal(
        string memory _description,
        address tokenContract,
        uint256 tokenId
    ) external onlyMember(tokenContract, tokenId) {
        proposalCount++;
        proposals[proposalCount] = Proposal({
            id: proposalCount,
            description: _description,
            voteCount: 0,
            againstCount: 0,
            executed: false
        });
        
        emit ProposalCreated(proposalCount, _description);
    }
    
    function vote(
        uint256 _proposalId,
        bool _support,
        address tokenContract,
        uint256 tokenId
    ) external onlyMember(tokenContract, tokenId) {
        require(_proposalId > 0 && _proposalId <= proposalCount, "Invalid proposal ID");
        require(!hasVoted[_proposalId][msg.sender], "Already voted");
        
        Proposal storage proposal = proposals[_proposalId];
        if (_support) {
            proposal.voteCount++;
        } else {
            proposal.againstCount++;
        }
        
        hasVoted[_proposalId][msg.sender] = true;
        emit Voted(_proposalId, msg.sender, _support);
    }
    
    function executeProposal(uint256 _proposalId) external onlyOwner {
        Proposal storage proposal = proposals[_proposalId];
        require(!proposal.executed, "Proposal already executed");
        require(proposal.voteCount > proposal.againstCount, "Proposal did not pass");
        
        proposal.executed = true;
        emit ProposalExecuted(_proposalId);
    }
    
    function setRoleRegistry(address _roleRegistry) external onlyOwner {
        roleRegistry = RoleRegistry(_roleRegistry);
    }
}