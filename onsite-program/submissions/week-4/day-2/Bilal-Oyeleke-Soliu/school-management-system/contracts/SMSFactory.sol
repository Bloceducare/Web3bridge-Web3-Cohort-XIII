// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { SchoolManagement } from "./SchoolManage.sol";

contract SMSFactory {
    address[] public smsContractAddresses;
    address contractAddress;
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    function createSMS() external {
        SchoolManagement sms = new SchoolManagement(owner);
        contractAddress = address(sms);
        smsContractAddresses.push(contractAddress);
    }

    function getSMS() external view returns(address[] memory) {
        return smsContractAddresses;
    }
}
