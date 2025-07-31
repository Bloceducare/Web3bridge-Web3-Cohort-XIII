// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract GarageManagementSystem {

    enum Role { 
        MEDIATEAM,
        MENTORS, 
        MANAGERS, 
        SOCIALMEDIATeam, 
        TECHNICIANSUPERVISORS, 
        KITCHENSTAFF }

    enum Status { 
        ACTIVE, 
        INACTIVE, 
        TERMINATED }

    struct Employee {
        string name;
        Role role;
        Status status;
    }

    mapping(address => Employee) public employees;
    Employee[] public employeeList;

    function add_employee_toList(address _employeeAddress, string memory _name, Role _role) external {
        require(bytes(employees[_employeeAddress].name).length == 0, "Employee already exists");
        Employee memory newEmployee = Employee({
            name: _name,
            role: _role,
            status: Status.ACTIVE
        });
        employees[_employeeAddress] = newEmployee;
        employeeList.push(newEmployee);
    }

    function can_access_garage(address _employeeAddress) external view returns (bool) {
        Employee memory employee = employees[_employeeAddress];
        if (employee.status != Status.ACTIVE) {
            return false;
        }
        if (employee.role == Role.MEDIATEAM || employee.role == Role.MENTORS || employee.role == Role.MANAGERS) {
            return true;
        }
        return false;
    }

    function get_all_employees() external view returns (Employee[] memory) {
        return employeeList;
    }

    function get_employee_details(address _employeeAddress) external view returns (Employee memory) {
        return employees[_employeeAddress];
    }
}