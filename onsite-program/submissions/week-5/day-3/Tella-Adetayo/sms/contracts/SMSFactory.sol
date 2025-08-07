// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "./SMS.sol"; 

contract SMSFactory {
    address[] allSMSAddr;

    function createSMS(address _admin) external {
        SMS sms = new SMS(_admin); 
        allSMSAddr.push(address(sms));
    }

    function getAllSMS() external view returns (address[] memory) {
    return allSMSAddr;
    }
}