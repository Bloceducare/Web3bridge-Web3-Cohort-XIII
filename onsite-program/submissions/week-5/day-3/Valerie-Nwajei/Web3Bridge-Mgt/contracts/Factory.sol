// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "./AccessMgt.sol";

contract Factory{

    address[] management;

    function createContract(address _owner) external{
        _owner = msg.sender;
        AccessMgt _newContract = new AccessMgt();
        management.push(address(_newContract));
    }
}