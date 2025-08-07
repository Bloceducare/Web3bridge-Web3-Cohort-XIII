// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "./SchoolManagementSystem.sol";

contract SMSFactory {
    address[] public deployedSMSContracts;

    event SMSCreated(address indexed creator, address smsAddress);

    function createSMS() external {
        SchoolManagementSystem newSMS = new SchoolManagementSystem();
        deployedSMSContracts.push(address(newSMS));

        emit SMSCreated(msg.sender, address(newSMS));
    }

    function getAllSMSContracts() external view returns (address[] memory) {
        return deployedSMSContracts;
    }
    //  https://sepolia-blockscout.lisk.com/address/0xb7Fe3243AF2a04c429153107b1d507e6d670DfCb#code
}
