// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./IERC7432.sol";

contract DAO{
    IERC7432 public erc7432;


    uint256 public proposalCount;
    address public operator;
    uint256 public totalVotes;

     constructor(address _erc7432) {
        erc7432 = IERC7432(_erc7432);
        operator = msg.sender;
    }

    mapping(uint256 => Proposal) public proposals;
    mapping(address => mapping(uint256 => bool)) public hasVoted;

    enum Status {Pending, Accepted, Rejected }

    bytes32 public constant VOTER_ROLE = keccak256("VOTER_ROLE");
    bytes32 public constant PROPOSER_ROLE = keccak256("PROPOSER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    
    struct Proposal {
        uint256 id;
        address proposer;
        string description;
        uint256 voteEnd;
        uint256 forVotes;
        uint256 againstVotes;
        bool executed;
        Status status;     
    }

    error NotAuthorized() ;
    error NotAccepted() ;
    error AlreadyExist();
    
    event ProposalCreated(uint256 indexed id, address indexed proposer, string description, uint256 voteEnd);
    event VoteCast( address indexed voter, uint256 indexed proposalId, bool support, uint256 weight);
    event ProposalExecuted(uint256 indexed id);
    event TreasuryDisbursed(uint256 indexed id);
    
    
    modifier onlyRoleHolder(bytes32 role, address tokenAddress, uint256 tokenId) {
        require( _hasRole(msg.sender, role, tokenAddress, tokenId), "TokenGatedDAO: caller doesn't have required role" );
        _;
    }
    
    function createProposal( string memory _description, uint256 _voteDuration, address _tokenAddress, uint256 _tokenId, uint256 _id) 
    external onlyRoleHolder(PROPOSER_ROLE, _tokenAddress, _tokenId) {
        if(proposals[_id].id != _id) revert AlreadyExist();
        if(proposals[_id].proposer != msg.sender) revert AlreadyExist();

        uint256 voteEnd = block.timestamp + _voteDuration;
        proposalCount++;
        proposals[proposalCount] = Proposal({
            id : proposalCount ,
            proposer : msg.sender,
            description : _description,
            voteEnd: voteEnd,
            forVotes : 0,
            againstVotes : 0,
            executed : false,
            status : Status.Pending
           
        });
        
        emit ProposalCreated(proposalCount, msg.sender, _description, voteEnd);
    }
    
    function vote( uint256 _proposalId, bool _support, address _tokenAddress, uint256 _tokenId
    ) external onlyRoleHolder(VOTER_ROLE, _tokenAddress, _tokenId) {
        Proposal storage proposal = proposals[_proposalId];
        
        require(block.timestamp <= proposal.voteEnd, "voting period ended");
        require(hasVoted[msg.sender][_proposalId], "already voted");
        
        uint256 voteCount = 1;
        totalVotes++ ;
        
        if (_support) {
            proposal.forVotes += voteCount;
        } else {
            proposal.againstVotes += voteCount;
        }
        
        emit VoteCast(msg.sender, _proposalId, _support, voteCount);
    }
    
   
    function isProposalPassable(uint256 _proposalId) external view returns (bool) {
        Proposal storage proposal = proposals[_proposalId];
        return 
            block.timestamp > proposal.voteEnd && 
            !proposal.executed && 
             proposal.forVotes > proposal.againstVotes;
        
    }

    function acceptProposal(uint256 _id ,address _tokenAddress, uint256 _tokenId) public onlyRoleHolder(ADMIN_ROLE, _tokenAddress, _tokenId) {
        if(msg.sender != operator){
            revert NotAuthorized();
        }
        uint256 averageVote = totalVotes / 2 ;
        require(proposals[_id].forVotes > averageVote, "Not enough vote");
        proposals[_id].status = Status.Accepted;

        emit TreasuryDisbursed(_id);

    }


    function executeProposal( uint256 _proposalId, address _tokenAddress,uint256 _tokenId
    ) external onlyRoleHolder(ADMIN_ROLE, _tokenAddress, _tokenId) {
        Proposal storage proposal = proposals[_proposalId];
        
        require(block.timestamp > proposal.voteEnd, "TokenGatedDAO: voting not ended");
        require(!proposal.executed, "TokenGatedDAO: already executed");
        require(proposal.forVotes > proposal.againstVotes, "TokenGatedDAO: proposal failed");
        
        proposal.executed = true;
        
        emit ProposalExecuted(_proposalId);
    }
    
    function getProposal(uint256 _proposalId) external view returns (uint256) {
       return proposals[_proposalId].id;
    }

    function _hasRole( address _account, bytes32 _role, address _tokenAddress, uint256 _tokenId
    ) internal view returns (bool) {
        if (erc7432.recipientOf(_tokenAddress, _tokenId, _role) == _account) {
            return true;
        }
        address owner = erc7432.ownerOf(_tokenAddress, _tokenId);
        if (erc7432.isRoleApprovedForAll(_tokenAddress, owner, _account)) {
            return true;
        }
        
        return false;
    }

}