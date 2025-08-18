// SPDX-License-Identifier: Unlicense

pragma solidity ^0.8.28;

library Storage {
    struct Role {
        bytes32 roleId;
        address tokenAddress;
        uint256 tokenId;
        address recipient;
        uint64 expirationDate;
        bool revocable;
        bytes data;
    }

    struct Proposal {
        address proposer;
        string description;
        uint256 voteCount;
        uint256 endTime;
        bool executed;
        mapping(address => bool) hasVoted;
    }

    event RoleGranted( address indexed _tokenAddress, address _owner, address _recipient, uint64 _expirationDate, bool _revocable );

    event RoleRevoked(address indexed _tokenAddress, uint256 indexed _tokenId, bytes32 indexed _roleId);

    event RoleApprovalForAll(address indexed _tokenAddress, address indexed _operator, bool _approved);

    event ProposalCreated(uint256 indexed proposalId, address indexed proposer, string description);

    event Voted(uint256 indexed proposalId, address indexed voter, uint256 voteCount);

    event FundsWithdrawn(address indexed recipient, uint256 amount);

    event FundsDeposited(address indexed sender, uint256 amount);

    event ProposalExecuted(uint256 indexed proposalId);


    error Invalid_token_address();
    error Invalid_expiration_date();
    error Not_authorized();
    error Role_does_not_exist();
    error Role_is_not_revocable();
    error Not_authorized_for_role();
    error Role_expired();
    error Invalid_proposal_ID();
    error Voting_period_ended();
    error Already_voted();
    error Must_Send_Eth();
    error Invalid_deposit_amount();
    error Insufficient_votes();
    error Proposal_already_executed();
    error Insufficient_balance();
    error Amount_must_be_greater_than_0();
    error Transfer_failed();
    error You_have_already_minted_an_NFT();
}