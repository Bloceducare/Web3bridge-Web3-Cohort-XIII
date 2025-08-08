// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.28;

import "../libraries/Storage.sol";

interface iMultiSignatureAccountInterface {

    function submit(address _acctAddress, uint _value, bytes calldata _acctData, string memory _acctDescription) external;

    function approve(uint _transID) external;
    
    function getApprovalCount(uint _transID) external view returns (uint count);

    function execute(uint _transID) external;

    function revoke(uint _transID) external;

    function view_transaction(uint _transID) external view returns (Storage.MultiSignatureAccount memory);
}