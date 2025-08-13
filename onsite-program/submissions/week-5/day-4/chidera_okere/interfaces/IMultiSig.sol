//SPDX-License-Identifier: MIT

pragma solidity ^0.8.28;


interface IMultiSig {
    function send_transaction(address to, uint256 value, bytes memory data) external returns (bool);
    function approve(uint256 _txId) external returns(bool);
    function revoke(uint256 _txId) external;
    function execute(uint256 _txId) external;
}

interface IMultiSigFactory {
    function createMultiSig(address[] memory _owners, uint256 _required) external returns (address);
}


