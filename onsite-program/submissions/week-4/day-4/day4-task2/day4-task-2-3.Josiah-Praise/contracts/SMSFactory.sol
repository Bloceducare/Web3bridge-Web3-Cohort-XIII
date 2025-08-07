// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {SchoolManagementSystem} from "./SMS.sol";

contract SMSFactory{
    SchoolManagementSystem public SMSInstance;

    constructor(){
        SMSInstance = new SchoolManagementSystem();
    }

    function pingSMS(string calldata anyString)external view returns(string memory) {
        return SMSInstance.ping(anyString);
    }
}