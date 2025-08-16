// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;
import "../interface/IERC7432.sol";
import {DAONFT} from "./DAONFT.sol";

contract DAO is IERC7432 {

  // ROLE Struct from the IERC7432
  Role[] roles;

  // Initialial a Contract type variable
  DAONFT daoNFT;

  //A STRUCT PROPOSAL
  struct Proposal {
    string title;
    string description;
    uint256 numOfVote;
    uint256 startTime;
    uint256 dealine;
    Status status;

  }

  
// MAPPING TO KEEP TRACK OF WHICH ADDRESS HAS VOTED
  mapping(address =>mapping(uint256 => bool)) hasVoted;

  // AN ARRAY OF PROPOSALS
   Proposal[] proposals;

 //MAPPING TO KEEP TRACK OF USER ROLE
  mapping(address => Role) userRole;

  //ID TO TRACK NFT TOKEN ID
  uint256 private _nextTokenId;

  // ENUM FOR STATUS FOR PROPOSAL
    enum Status {
      ACTIVE,
      EXPIRED,
      PASSED,
      REJECTED
    }

    // INTIALIZE THE NFT CONTRACT ON WHEN YOU DEPLOY
    constructor() {

      DAONFT _daonft = new DAONFT();
      daoNFT = _daonft;
      
      userRole[msg.sender] =  Role(keccak256("ADMIN"), address(_daonft), _nextTokenId, msg.sender);
      daoNFT.safeMint(msg.sender, _nextTokenId);

      _nextTokenId++;

    }

  // A FUNCTION TO UPDATE PROPOSAL TITLE AND DESCRIPTION
  function update_proposal(uint256 _index, string memory _title, string memory _description ) external {
    proposals[_index].title = _title;
    proposals[_index].description = _description;
  }

  // GET ALL PROPOSALS
  function get_proposals() external view returns (Proposal[] memory) {
    return proposals;
  }


  // GET A SINGLE PROPOSAL USINF INDEX
  function get_proposal(uint256 _index) external view returns(Proposal memory) {
    return proposals[_index];
  }

  // CREATE A PROPOSAL
  function create_proposal(string memory _title, string memory _description, uint256 _deadline) external {

    uint256 deadline_ = block.timestamp + (_deadline * 1 minutes);
    require(userRole[msg.sender].roleId == keccak256("ADMIN"), "Only Admin can create Proposals");
    
    Proposal memory proposal_ = Proposal(_title, _description, 0, block.timestamp, deadline_, Status.ACTIVE);

    proposals.push(proposal_);

  }

  // VOTE ON A PROPOSAL
  function vote_on_proposal(uint256 _index) external {
    if(proposals[_index].dealine < block.timestamp) {
      proposals[_index].status = Status.EXPIRED;

      revert("YOU CANT VOTE ON EXPIRED PROPOSAL");
    }

    require(userRole[msg.sender].roleId == keccak256("MEMBER") || userRole[msg.sender].roleId == keccak256("ADMIN"), "YOU NEED ROLE TO VOTE");
   
    require(proposals[_index].status == Status.ACTIVE, "YOU CAN ONLY VOTE ON ACTIVE PROPOSAL");
    
    if(hasVoted[msg.sender][_index] == true) {
      revert("ALREADY VOTED");
    }

    proposals[_index].numOfVote += 1;
    hasVoted[msg.sender][_index] = true;
  }

  //GRANT ROLE TO USERS AND MINT AN NFT TO THEIR WALLET
 function grantRole(
    address _tokenAddress,
    uint256 _tokenId,
    address _recipient
 ) external {

   require(userRole[msg.sender].roleId == keccak256("ADMIN"), "ONLY ADMIN CAN GRANT ROLE");

   bytes32 roleId_ = keccak256("MEMBER_ROLE");
  
   _tokenId = _nextTokenId++;

   userRole[_tokenAddress] = Role(roleId_, _tokenAddress, _tokenId, _recipient);

   daoNFT.safeMint(_recipient, _tokenId);

   roles.push(userRole[_recipient]);
    
  }


  // REVOKE A USER ROLE 
  function revokeRole(address _tokenAddress, uint256 _tokenId) external {
    
    for(uint256 i; i < roles.length; i++) {
      address addy = roles[i].recipient;
      if(roles[i].roleId == keccak256("MEMBER_ROLE") && roles[i].tokenAddress == _tokenAddress && roles[i].tokenId == _tokenId) {
        roles[i].roleId = keccak256("NOT_A_MEMBER");

        userRole[addy].roleId = keccak256("NOT_A_MEMBER");

        return;
      }
    }

    revert("YOU_CAN_ONLY_REVOKE_A_MEMBER_PERMISSION");
  }


  // CHECJ OWNER OF A PARTICULAR NFT AND NFT ID
   function ownerOf(address _tokenAddress, uint256 _tokenId) external view returns (address owner_) {
    
    for(uint256 i; i < roles.length; i++) {
      if(roles[i].tokenAddress == _tokenAddress && roles[i].tokenId == _tokenId) {

        return roles[i].recipient;
      }
    }
   }


  // CHECK WHO RECEIVED AN NFT
  function recipientOf(
    address _tokenAddress,
    uint256 _tokenId

  ) external view returns (address recipient_) {
    bytes32 _roleId = keccak256("MEMBER"); 

    for(uint256 i; i < roles.length; i++) {
    
      if(roles[i].tokenAddress == _tokenAddress && roles[i].tokenId == _tokenId && roles[i].roleId == _roleId) {

        return roles[i].recipient;
      }
    }
  }


  
  }






