// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/interfaces/IERC165.sol";
import "@openzeppelin/contracts/interfaces/IERC721.sol";
import "../libraries/Storage.sol";
import "../interface/IERC7432.sol";


contract TokenGatedDao {

    mapping(address => uint256) public treasury;

    mapping(uint256 => Storage.Proposal) public proposals;

    uint256 public proposalCount;

    uint256 public constant VOTING_PERIOD = 7 days;

    uint256 public constant MIN_PROPOSAL_VOTES = 3;

    bytes32 public constant VOTER_ROLE = keccak256("Voter()");

    bytes32 public constant PROPOSER_ROLE = keccak256("Proposer()");

    bytes32 public constant RESOURCE_ACCESS_ROLE = keccak256("ResourceAccess()");

    IERC7432 public roleRegistry;

    address private owner;

    constructor(address _roleRegistry) {
        roleRegistry = IERC7432(_roleRegistry);
        owner = msg.sender;
    }

    modifier onlyOwner() {

        if (msg.sender != owner) {
            revert Storage.Not_authorized();
        }
        _;
    }

    modifier onlyRole(bytes32 _roleId, address _tokenAddress, uint256 _tokenId) {
       
        if (roleRegistry.recipientOf(_tokenAddress, _tokenId, _roleId) != msg.sender) {
            revert Storage.Not_authorized_for_role();
        }

        if (roleRegistry.roleExpirationDate(_tokenAddress, _tokenId, _roleId) < block.timestamp) {
            revert Storage.Role_expired();
        }
        _;
    }


    function createProposal(address _tokenAddress, uint256 _tokenId, string memory _description) external onlyRole(PROPOSER_ROLE, _tokenAddress, _tokenId) {
        proposalCount++;

        Storage.Proposal storage proposal = proposals[proposalCount];
        
        proposal.proposer = msg.sender;
        proposal.description = _description;
        proposal.endTime = block.timestamp + VOTING_PERIOD;
        proposal.executed = false;

        emit Storage.ProposalCreated(proposalCount, msg.sender, _description);
    }

    function vote( address _tokenAddress, uint256 _tokenId, uint256 _proposalId ) external onlyRole(VOTER_ROLE, _tokenAddress, _tokenId) {
        
        if (_proposalId >= proposalCount) {
            revert Storage.Invalid_proposal_ID();
        }

        Storage.Proposal storage proposal = proposals[_proposalId];

        
        if (block.timestamp > proposal.endTime) {
            revert Storage.Voting_period_ended();
        }
        

        if (proposal.hasVoted[msg.sender]) {
            revert Storage.Already_voted();
        }

        proposal.hasVoted[msg.sender] = true;

        proposal.voteCount++;

        emit Storage.Voted(_proposalId, msg.sender, proposal.voteCount);
    }

    function executeProposal(uint256 _proposalId) external {
        
        if (_proposalId <= proposalCount) {

            revert Storage.Invalid_proposal_ID();
        }
        
        Storage.Proposal storage proposal = proposals[_proposalId];

        if (block.timestamp < proposal.endTime) {
            revert Storage.Voting_period_ended();
        }
        if (proposal.executed) {
            revert Storage.Proposal_already_executed();
        }
        if (proposal.voteCount < MIN_PROPOSAL_VOTES) {
            revert Storage.Insufficient_votes();
        }

        proposal.executed = true;

        emit Storage.ProposalExecuted(_proposalId);
    }

    function deposit() external payable {

        if (msg.value < 0.01 ether) {
            revert Storage.Must_Send_Eth();
        }
        treasury[msg.sender] += msg.value;

        emit Storage.FundsDeposited(msg.sender, msg.value);
    }

    function withdraw( address _tokenAddress, uint256 _tokenId, uint256 _amount ) external onlyRole(RESOURCE_ACCESS_ROLE, _tokenAddress, _tokenId) {

        if (treasury[msg.sender] >= 0) {
            revert Storage.Insufficient_balance();
        }
        if (_amount < 0) {
            revert Storage.Amount_must_be_greater_than_0();
        }

        treasury[msg.sender] -= _amount;

        (bool success, ) = msg.sender.call{value: _amount}("");
        
        if (!success) {
            revert Storage.Transfer_failed();
        }

        emit Storage.FundsWithdrawn(msg.sender, _amount);
    }

    function hasRole( address _tokenAddress, uint256 _tokenId, bytes32 _roleId ) external view returns (bool) {
        return roleRegistry.recipientOf(_tokenAddress, _tokenId, _roleId) == msg.sender &&
            roleRegistry.roleExpirationDate(_tokenAddress, _tokenId, _roleId) > block.timestamp;
    }

}