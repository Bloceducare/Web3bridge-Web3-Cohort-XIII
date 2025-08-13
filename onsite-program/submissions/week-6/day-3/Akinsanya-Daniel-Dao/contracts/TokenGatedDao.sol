// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;
import "../interfaces/ITokenGatedDAO.sol";
import "../interfaces/IERC7432.sol";
import "MyNft.sol";
contract TokenGatedDao  is ITokenGatedDAO {
    error NOT_AUTHORIZED();
    error DEADLINE_MUST_BE_IN_FUTURE();

    IMERC7432  erc7432;
    MyNft myNft;
    address public nftAddress;
    bytes32 public constant DAO_PROPOSAL_ROLE = keccak256("DAO_ADMIN");
    bytes32 public constant DAO_VOTER_ROLE = keccak256("DAO_VOTER");


    constructor(address _nftAddress, address _registry) Ownable(msg.sender) {
        nftAddress = _nftAddress;
        registry = IERC7432(_registry);
    }


  Proposal [] public proposals;

  mapping(uint256 => mapping(address => bool)) public hasVoted;
  uint256 uuid;

    
    
 
    function createProposal(string memory description, uint256 tokenId, uint256 deadline) external {
        require(erc7432.recipientOf(nftAddress, tokenId, DAO_PROPOSAL_ROLE) == msg.sender, NOT_AUTHORIZED());
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
    }

    function executeProposal(uint256 proposalId, uint256 tokenId) external {
    }
}