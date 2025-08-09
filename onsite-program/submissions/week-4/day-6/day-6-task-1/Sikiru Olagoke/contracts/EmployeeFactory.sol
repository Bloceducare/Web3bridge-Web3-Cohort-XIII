
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;


import './EmployeeManagement.sol';

contract EmployeeFactory {
  
  address[] employees;
  address manager;

  function init_employee() external {

    manager = msg.sender;

    EmployeeManagement employeeManagement = new EmployeeManagement(manager);
    employees.push(address(employeeManagement));
    
  }

  function get_factory_addresses() external view returns (address[] memory) {
    return employees;
  }
}
