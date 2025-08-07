// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./EmployeeManagement.sol";

contract Factory {
    address[] children;

    function create_employee(address _owner) external {
        _owner = msg.sender;
        EmployeeManagement employeeManagement = new EmployeeManagement(_owner);
        children.push(address(employeeManagement));
    }
}