// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "./StudentMgt.sol";

contract Factory{

    address[] management;

    function createContract(address _owner) external{
        _owner = msg.sender;
        StudentMgt _newContract = new StudentMgt();
        management.push(address(_newContract));
    }
}