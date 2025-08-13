// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.10;

interface IDao {

    struct Proposal {
        uint256 id;
        address createdBy;
        string description;
        uint256 votesFor;
        uint256 votesAgainst;
        bool executed;
    }

  function createProposal(string memory description) external returns(Proposal memory);

  function vote(uint256 proposalId) external;

  function  executeProposal(uint256 proposalId) external;
  function getProposals() view external returns(Proposal [] memory);

  function getProposal(uint256 proposalId) view external returns(Proposal memory);

}
