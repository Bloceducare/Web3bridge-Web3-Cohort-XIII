// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;


interface ITokenGatedDAO{
    struct Proposal {
        uint256 id;
        string description;
        uint256 deadline;
        uint256 yesVotes;
        uint256 noVotes;
        bool executed;
    }

    function createProposal(string _description,uint256 _tokenId, uint256 deadline,) external;
    function vote(uint256 proposalId, uint256 _tokenId,bool support) external;
    function executeProposal(uint256 proposalId, uint256 _tokenId) external;
    function getProposal(uint256 proposalId) external view returns (Proposal memory);
}