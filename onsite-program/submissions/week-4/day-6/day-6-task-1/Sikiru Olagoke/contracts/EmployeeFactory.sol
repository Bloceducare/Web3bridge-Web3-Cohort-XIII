
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

  function manager_pay_employee(uint256 _index, address _employer_address, uint256 _amount) external {
        require(manager == msg.sender, "You can't pay employees");
        EmployeeManagement employee = new EmployeeManagement(employees[_index]);
        employee.pay_employee(_employer_address, _amount);

  }

  function manager_get_employees(uint256 _index) external {
    EmployeeManagement employee = new EmployeeManagement(employees[_index]);
    employee.get_all_employees();
  }

  function get_factory_addresses() external view returns (address[] memory) {
    return employees;
  }
}
