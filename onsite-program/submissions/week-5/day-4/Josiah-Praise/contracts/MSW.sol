//SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Transaction} from "./structs/transaction.sol";

/// @notice a multisig wallet. This wallet has a set number of owners and requires
/// approval from the owners. The number of approvals required must be at
/// least equal to the confirmation threshold
contract MultiSigWallet{
    mapping(uint=>mapping(address=>bool)) public confirmations;
    mapping(uint=> Transaction) public transactions_map;
    uint[] public transaction_ids;

    uint public immutable i_confirmationThreshold;
    mapping(address=>bool) public isOwner;

    error MSG__UnAuthorized();
    error MSG__ProposalNotFound();
    error MSG__ProposalAlreadyExecuted();
    error MSG__ProposalThresholdNotMet();
    error MSG__InsufficientFunds();
    error MSG__ZeroAddressError();
    error MSG__ExecutionFailed();
    error MSG__AlreadyExecuted();

    event Proposal(uint indexed transactionId);
    event Approval(address indexed approver, uint indexed transactionID);
    event Execution(uint indexed transactionId);

    /// @notice ensures only owners have access control
    modifier onlyOwner{
        if(!isOwner[msg.sender]) 
            revert MSG__UnAuthorized();
        _;
    }

    constructor(address[] memory owners, uint threshold) {
        if (owners.length == 0) {
            revert("Must pass at least one owner");
        }
        if (threshold == 0) {
            revert("Threshold cannot be 0");
        }
        if (threshold > owners.length){
            revert("Threshold cannot be more than the number of owners");
        }
        
        
        for(uint i; i < owners.length; ++i) {
            isOwner[owners[i]] = true;
        }
        i_confirmationThreshold = threshold;
    }

    /// @notice submit a proposal for approval by the owners
    function submitProposal(
        uint value,
        address to
    )external onlyOwner returns(uint){
        if (to == address(0)){
            revert MSG__ZeroAddressError();
        }
        
        uint transaction_id = transaction_ids.length;
        
        // create transaction
        Transaction memory transaction = Transaction(value, 0, transaction_id, to, true, false);

        // add transaction to transactions_map
        transactions_map[transaction_id] = transaction;

        // add transaction to id array
        transaction_ids.push(transaction_id);

        emit Proposal(transaction_id);

        return transaction_id;
    }

    /// @notice approve a proposal...only owners can approve proposals
    function approveProposal(uint proposalID)external onlyOwner {
        if(transactions_map[proposalID].exists != true) {
            revert MSG__ProposalNotFound();
        }
        if(transactions_map[proposalID].executed) {
            revert MSG__ProposalAlreadyExecuted();
        }

        if (!confirmations[proposalID][msg.sender]) {
            confirmations[proposalID][msg.sender] = true;
            transactions_map[proposalID].numberOfConfirmations += 1;
            emit Approval(msg.sender, proposalID);
        }
    }

    /// @notice execute a proposal if it meets the confirmation threshold
    function executeProposal(uint proposalID)external {
        if(transactions_map[proposalID].exists != true) {
            revert MSG__ProposalNotFound();
        }
        if (transactions_map[proposalID].executed) {
            revert MSG__ProposalAlreadyExecuted();
        }
        if (transactions_map[proposalID].numberOfConfirmations < i_confirmationThreshold){
            revert MSG__ProposalThresholdNotMet();
        }
        if (transactions_map[proposalID].value > address(this).balance) {
            revert MSG__InsufficientFunds();
        }
        Transaction storage transaction = transactions_map[proposalID];

        transaction.executed = true;

        // execute transaction
        (bool success,) = transaction.to.call{value: transaction.value}("");

        if (!success) {
            revert MSG__ExecutionFailed();
        }
        emit Execution(proposalID);
    }

    /// @notice returns an all proposal ids as an array
    function getAllProposals() external view returns (uint[] memory) {
        return transaction_ids;
    }

    /// @notice gets a proposal by proposalID
    function getProposal(uint proposalID) external view returns (Transaction memory) {
        return transactions_map[proposalID];
    }

    /// @notice checks if a proposal has been approved
    function hasApproved(uint proposalID, address approver) external view returns (bool) {
        return confirmations[proposalID][approver];
    }

    /// @notice for receiving eth into the contract's account
    receive() external payable {}
}