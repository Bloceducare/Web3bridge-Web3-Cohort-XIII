// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "./interfaces/IERC7432.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";


interface IMINT{
    function mint(address _to, string memory _tokenURI) external returns(uint256);
}

contract DAO {
    IERC7432 public rolesContract;
    IERC721 public nftContract;

    mapping(uint256 => Roles) idToRole;
    mapping(uint256=>mapping(uint256=>bool)) hasVote;

    address owner;

    enum Roles {
        NONE,
        GOVERNOR,
        EXECUTIVE,
        MEMBER
    }

    struct Proposal {
        uint256 id;
        address proposer;
        string description;
        uint256 startTime;
        uint256 endTime;
        uint256 forVotes;
        uint256 againstVotes;
        bool executed;
        bool canceled;
    }
    uint256 proposalId;
    mapping(uint256 => Proposal) idToProposal;

    constructor(address _erc7432Address, address _nftAddress) {
        rolesContract = IERC7432(_erc7432Address);
        nftContract = IERC721(_nftAddress);
        owner = msg.sender;

     
    }

    function grantRole(
        address _recipient,
        address _token_address,
        uint256 _tokenId,
        uint64 _expirationDate,
        bool _revocable,
        Roles _roleToGrant,
        bytes memory _data
    ) external {
       if (msg.sender != owner) {
        revert("not authorised");
       }

        rolesContract.grantRole(
            IERC7432.Role(
                _getRoleId(_roleToGrant),
                _token_address,
                _tokenId,
                _recipient,
                _expirationDate,
                _revocable,
                _data
            )
        );

        idToRole[_tokenId] = _roleToGrant;
    }

    function revokeRole(
        address _tokenAddress,
        uint256 _tokenId
    ) external {
        Roles role = idToRole[_tokenId];
         if (rolesContract.recipientOf(_tokenAddress, _tokenId, _getRoleId(role)) != msg.sender) {
            revert("CALLER_NOT_RECIPIENT_OF_ROLE");
        }
        if (role != Roles.GOVERNOR) {
            revert("NOT_AUTHORIZED");
        }
        rolesContract.revokeRole(_tokenAddress, _tokenId, _getRoleId(role));
    }

    function createProposal(
        string memory _description,
        uint256 _endTime,
        uint256 _tokenId,
        address _tokenAddress
    ) external {
        Roles role = idToRole[_tokenId];
        if (rolesContract.recipientOf(_tokenAddress, _tokenId, _getRoleId(role)) != msg.sender) {
            revert("CALLER_NOT_RECIPIENT_OF_ROLE");
        }

        if (role != Roles.EXECUTIVE && role != Roles.GOVERNOR) {
            revert("NOT_AUTHORIZED");
        }

        require(_endTime > block.timestamp, "END_TIME_MUST_BE_IN_FUTURE");

        Proposal memory proposal = Proposal(
            proposalId,
            msg.sender,
            _description,
            block.timestamp,
            _endTime,
            0,
            0,
            false,
            false
        );

        idToProposal[proposalId] = proposal;
        proposalId++;
    }

    function cancelProposal(
        uint256 _proposalId,
        address _tokenAddress,
        uint256 _tokenId
    ) external {

        Roles role = idToRole[_tokenId];
        if (rolesContract.recipientOf(_tokenAddress, _tokenId, _getRoleId(role)) != msg.sender) {
            revert("CALLER_NOT_RECIPIENT_OF_ROLE");
        }

        if (
            role != Roles.EXECUTIVE &&
            role != Roles.GOVERNOR &&
            role != Roles.MEMBER
        ) {
            revert("NOT_AUTHORIZED");
        }
        Proposal memory proposal = idToProposal[_proposalId];

        if (role == Roles.MEMBER && proposal.proposer != msg.sender){
            revert("NOT_AUTHORIZED");
        }
        proposal.canceled = true;
        idToProposal[_proposalId] = proposal;
    }

    function setProposalExecution(
        uint256 _proposalId,
        bool isExecuted,
        uint256 _tokenId,
        address _tokenAddress
    ) external {
        Roles role = idToRole[_tokenId];
         if (rolesContract.recipientOf(_tokenAddress, _tokenId, _getRoleId(role)) != msg.sender) {
            revert("CALLER_NOT_RECIPIENT_OF_ROLE");
        }
        if (
            role != Roles.EXECUTIVE &&
            role != Roles.GOVERNOR
        ) {
            revert("NOT_AUTHORIZED");
        }
        Proposal memory proposal = idToProposal[_proposalId];
        proposal.executed = isExecuted;
        idToProposal[_proposalId] = proposal;
    }

    function voteProposal(
        uint256 _tokenId,
        address _tokenAddress,
        bool _vote,
        uint256 _proposalId
    ) external {

        Roles role = idToRole[_tokenId];
        if (rolesContract.recipientOf(_tokenAddress, _tokenId, _getRoleId(role)) != msg.sender) {
            revert("CALLER_NOT_RECIPIENT_OF_ROLE");
        }

        if(hasVote[_tokenId][_proposalId]){
            revert("ALREADY_VOTED_THIS_PROPOSAL");
        }


        
        if (
            role != Roles.EXECUTIVE &&
            role != Roles.GOVERNOR &&
            role != Roles.MEMBER
        ) {
            revert("NOT_AUTHORIZED");
        }

        Proposal storage proposal = idToProposal[_proposalId];

        require(block.timestamp <= proposal.endTime, "PROPOSAL_EXPIRED");

        if (_vote) {
            proposal.forVotes = proposal.forVotes + 1;
        } else {
            proposal.againstVotes = proposal.againstVotes + 1;
        }

        hasVote[_tokenId][_proposalId] = true;
    }

    function getProposal(
        uint256 _proposalId
    ) external view returns (Proposal memory) {
        return idToProposal[_proposalId];
    }

    function _getRoleId(Roles role) internal pure returns (bytes32 roleId) {
        if (role == Roles.EXECUTIVE) {
            return keccak256("EXECUTIVE");
        }

        if (role == Roles.MEMBER) {
            return keccak256("MEMBER");
        }

        if (role == Roles.GOVERNOR) {
            return keccak256("GOVERNOR");
        }

        return keccak256("NONE");
    }
}
