// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IMultiSig {

    struct Transaction{
        address to;
        uint value;
        bytes data;
        bool executed;
        uint approvalCount;
        
    }

    function ProposedTransaction(address _to, uint256 _value, bytes memory _data) external returns (uint txId);
    function approveTransaction(uint256 _txId) external;
    function getTransaction(uint256 _txId) external view returns (address to, uint256 value, bytes memory data, bool executed, uint256 approvalCount);


}