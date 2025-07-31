//SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

contract Web3bridgeEmployee {
    enum EmployeeRole {
        Mentors,
        Media_Team,
        Managers,
        Social_Media_Team,
        Technician_Supervisors,
        Kitchen_Staff
    }

    struct EmployeeData {
        string name;
        EmployeeRole role;
        bool isEmployed;
        address keyCard;
    }
    error EMPLOYEE_NOT_FOUND();
    EmployeeData[] public employees;
    mapping(address => EmployeeData) public address_to_employee;

    function add_employee(string memory _name, address _keyCard, bool _isEmployed, EmployeeRole _role) public {
        EmployeeData memory _newEmployee = EmployeeData({name: _name, keyCard: _keyCard, isEmployed: _isEmployed, role: _role});
        employees.push(_newEmployee);
        address_to_employee[_keyCard] = _newEmployee;
    }

    function update_employee(address _new_keyCard, string memory _new_name, bool _isEmployedStatus, EmployeeRole _new_role) public {
        for (uint256 i; i < employees.length; i++) {
            if (employees[i].keyCard == _new_keyCard) {
                employees[i].name = _new_name;
                employees[i].isEmployed = _isEmployedStatus;
                employees[i].role = _new_role;
                return;
            }

        }
        revert EMPLOYEE_NOT_FOUND();
    }
    function get_all_employees() public view returns (EmployeeData[] memory){
        return employees;
    }

    function canAccessGarage(address _keyCard) public view returns (bool) {
        EmployeeData memory employeeAccess = address_to_employee[_keyCard];

        if (!employeeAccess.isEmployed) {
        return false;
        }
        if (
        employeeAccess.role == EmployeeRole.Mentors ||
        employeeAccess.role == EmployeeRole.Media_Team ||
        employeeAccess.role == EmployeeRole.Managers
        ) {
        return true; 
        }

        return false; 
    }
}