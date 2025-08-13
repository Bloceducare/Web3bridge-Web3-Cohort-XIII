// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ITokenGateway} from "./ITokenGateway.sol";


contract GovernanceDAO{
    enum Role{
        DEFAULT, ADMIN,USER
    }
    struct Proposal{
        uint proposalId;
        uint votesFor;
        uint votesAgainst;
        string description;
        uint deadline;
    }

    uint private counter;
    mapping (address => mapping(uint => Proposal)) usersProposals;
    ITokenGateway public gateway;
    constructor(address tokenGateway){
        gateway = ITokenGateway(tokenGateway);
    }

    function createUser(address userCreated, Role userRole, string memory data)external{
        require(userRole != Role.DEFAULT,"Invalid Role created");
        string memory role = userRole == Role.USER ? "user" : "ADMIN";
        gateway.mint(userCreated,role, userRole != Role.USER, bytes(data) );
    }
    function isUser(address userAddress) public returns (bool) {
        return gateway.isUser(userAddress);
    }
    function revokeRole(address userAddress)external returns (bool){
        return gateway.revokeUserRole(userAddress);
    }
    function unlockToken(address userAddress)external{
        gateway.unlockToken(userAddress);
    }
    function getProposalById(uint proposalId) external view returns(Proposal memory){
        Proposal memory proposal = usersProposals[msg.sender][proposalId];
        require(proposal.proposalId!= 0,"PROPOSAL NOT FOUND");
        return proposal;
    }
    function createProposal(string memory description, uint deadline)external returns(uint){
        require(isUser(msg.sender),"UNAUTHORISED");
        counter = counter+1;
        Proposal memory proposal = Proposal(counter,0,0,description,deadline);
        usersProposals[msg.sender][counter]= proposal;
        return counter;
    }
   
}