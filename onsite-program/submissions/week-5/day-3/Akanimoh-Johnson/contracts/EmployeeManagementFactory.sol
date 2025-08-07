// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./EmployeeManagement.sol";

contract EmployeeManagementFactory {
    event EmployeeManagementDeployed(address indexed contractAddress);

    function deployEmployeeManagement() external returns (address) {
        EmployeeManagement newContract = new EmployeeManagement();
        emit EmployeeManagementDeployed(address(newContract));
        return address(newContract);
    }
}