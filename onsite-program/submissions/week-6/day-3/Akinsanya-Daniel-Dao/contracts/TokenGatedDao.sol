// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;
import "../interfaces/ITokenGatedDAO.sol";
import "./ERC7432.sol";
import "./MyNft.sol";
contract TokenGatedDao  is ITokenGatedDAO {
    error NOT_AUTHORIZED();
    error DEADLINE_MUST_BE_IN_FUTURE();
    error ALREADY_VOTED();
    error VOTING_PERIOD_ENDED();
    error PROPOSAL_ALREADY_EXECUTED();
    error PROPOSAL_NOT_APPROVED();

    ERC7432 erc7432;
    MyNft myNft;
   
    bytes32 public constant DAO_PROPOSAL_ROLE = keccak256("DAO_ADMIN");
    bytes32 public constant DAO_VOTER_ROLE = keccak256("DAO_VOTER");
    bytes32 public constant DAO_EXECUTOR_ROLE = keccak256("DAO_EXECUTOR");


    constructor(address _nftAddress, address _registry)  {
         myNft = MyNft(_nftAddress);
         erc7432 = ERC7432(_registry);
        
    }


  Proposal [] public proposals;

  mapping(uint256 => mapping(address => bool)) public hasVoted;
  mapping(uint256 => Proposal) public proposalDetails;
  uint256 uuid;

    
    
 
    function createProposal(string memory description, uint256 tokenId, uint256 deadline) external {
        require(erc7432.recipientOf(address(myNft), tokenId, DAO_PROPOSAL_ROLE) == msg.sender, NOT_AUTHORIZED());
        require(deadline > block.timestamp, DEADLINE_MUST_BE_IN_FUTURE());
        Proposal memory newProposal;
        newProposal.id = uuid++;
        newProposal.description = description;
        newProposal.deadline = deadline;
        newProposal.yesVotes = 0;
        newProposal.noVotes = 0;
        newProposal.executed = false;
        proposals.push(newProposal);

    }

    function vote(uint256 proposalId, uint256 tokenId, bool support) external {
      require(erc7432.recipientOf(address(myNft), tokenId, DAO_VOTER_ROLE) == msg.sender, NOT_AUTHORIZED());
      require(!hasVoted[proposalId][msg.sender], ALREADY_VOTED());
      Proposal storage proposal = proposalDetails[proposalId];
      require(block.timestamp < proposal.deadline, VOTING_PERIOD_ENDED());
      hasVoted[proposalId][msg.sender] = true;
        if (support) {
            proposal.yesVotes++;
        } else {
            proposal.noVotes++;
        }



    }

    function executeProposal(uint256 proposalId, uint256 tokenId) external {
        Proposal storage proposal = proposalDetails[proposalId];
        require(erc7432.recipientOf(address(myNft), tokenId, DAO_PROPOSAL_ROLE) == msg.sender, NOT_AUTHORIZED());
        require(block.timestamp >= proposal.deadline, VOTING_PERIOD_ENDED());
        require(!proposal.executed, PROPOSAL_ALREADY_EXECUTED());
        require(proposal.yesVotes > proposal.noVotes,PROPOSAL_NOT_APPROVED());
        proposal.executed = true;
    }

    
    function getProposal(uint256 proposalId) external view returns (Proposal memory){
        return proposals[proposalId];
    }
}