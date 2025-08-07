// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./SchoolManagementSystem.sol";

contract SchoolManagementSystemFactory {
    event SchoolManagementSystemDeployed(address indexed contractAddress);

    function deploySchoolManagementSystem() external returns (address) {
        SchoolManagementSystem newContract = new SchoolManagementSystem();
        emit SchoolManagementSystemDeployed(address(newContract));
        return address(newContract);
    }
}