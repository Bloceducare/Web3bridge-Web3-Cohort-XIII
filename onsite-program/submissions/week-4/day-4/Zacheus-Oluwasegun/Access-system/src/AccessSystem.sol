// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract AccessSystem {
    enum Role {
        MEDIA, MENTOR, MANAGER, SOCIAL_MEDIA, TECHNICIAN_SUPERVISOR, KITCHEN_STAFF
    }

    struct Employee {
        string name;
        Role role;
        bool isEmployed;
        address employeeAddress;
    }

    mapping (address => Employee) EmployeeLibrary;
    Employee[] allEmployees;
    error EMPLOYEE_NOT_FOUND();

    function register_employee(string calldata _name, Role _role, address _employee_address) external {                
        Employee memory newEmployee = Employee({
            name: _name,
            role: _role,
            isEmployed: true,
            employeeAddress: _employee_address
        });

        EmployeeLibrary[_employee_address] = newEmployee;
        allEmployees.push(newEmployee);
    }

    function get_all_employees() external view returns (Employee[] memory) {
        return allEmployees;
    }

    function get_employee_by_address(address _employee_address) external view returns (Employee memory) {
        Employee memory employee_to_return = EmployeeLibrary[_employee_address];

        if (employee_to_return.employeeAddress == address(0)) {
            revert EMPLOYEE_NOT_FOUND();
        }

        return employee_to_return;
    }

    function check_employee_access() external view returns (bool) {
        Employee memory employee_to_check = EmployeeLibrary[msg.sender];

        if (employee_to_check.employeeAddress == address(0)) {
            revert EMPLOYEE_NOT_FOUND();
        }

        bool isEmployed = employee_to_check.isEmployed;
        bool hasAccess = employee_to_check.role == Role.MEDIA || employee_to_check.role == Role.MENTOR || employee_to_check.role == Role.MANAGER;

        return isEmployed && hasAccess;
    }

    function update_employee_info(string calldata _new_name, address _new_address, address _old_address, bool _is_employed) external {
        Employee memory employee_to_update = EmployeeLibrary[_old_address];
        if (employee_to_update.employeeAddress == address(0)) {
            revert EMPLOYEE_NOT_FOUND();
        }
        // make sure to update both mapping and array. this just creates a new mapping entry with the new address with previous info
        employee_to_update.name = _new_name;
        employee_to_update.employeeAddress = _new_address;
        employee_to_update.isEmployed = _is_employed;

        EmployeeLibrary[_new_address] = employee_to_update;

        for(uint i; i < allEmployees.length; i++) {
            if (allEmployees[i].employeeAddress == _old_address) {                
                allEmployees[i] = employee_to_update; // update the array with the new employee info

                return;
            }
        }
    }

    function update_employee_role(address _employee_address, Role _new_role) external {        
        Employee memory employee_to_update = EmployeeLibrary[_employee_address];
        if (employee_to_update.employeeAddress == address(0)) {
            revert EMPLOYEE_NOT_FOUND();
        }

        employee_to_update.role = _new_role;
        EmployeeLibrary[_employee_address] = employee_to_update;
    }
}