// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import { EmployeeData } from "../libraries/Data.sol";

interface iEmployeeInterface {

    function register_employee (string memory _name, address _employeeAddress, EmployeeData.Role _role) external;

    function update_salary(address _employeeAddress) external;

    function pay_salary(address payable _to, uint256 _amount) external;

    function get_balance(address _employee_address) external view returns(uint256);

    function get_employee(address _employeeAddress) external view returns (EmployeeData.Employee memory);

    function get_all_employee() external view returns (EmployeeData.Employee[] memory);
}