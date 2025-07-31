// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SchoolAccess {

    enum Role { 
        MEDIA_TEAM, 
        MENTORS, 
        MANAGERS, 
        SOCIAL_MEDIA_TEAM, 
        TECHNICIAN_SUPERVISORS, 
        KITCHEN_STAFF, 
        TERMINATED 
    }

    struct Employee {
        string name;
        Role role;
        bool isEmployed;
        address wallet;
    }

    mapping(address => Employee) public employees;
    Employee[] public allEmployees;

    function addEmployee( address employeeWallet,string memory employeeName,Role employeeRole,bool employeeStatus) public {
        require(employees[employeeWallet].wallet == address(0), "Employee already exists");

        Employee memory newEmployee = Employee( employeeName,employeeRole,employeeStatus,employeeWallet);
        employees[employeeWallet] = newEmployee;
        allEmployees.push(newEmployee);
    }

    function updateEmployee(address employeeWallet,string memory employeeName,Role employeeRole,bool employeeStatus) public {
        require(employees[employeeWallet].wallet != address(0), "Employee does not exist");

        Employee memory updatedEmployee = Employee(employeeName,employeeRole,employeeStatus,employeeWallet);

        employees[employeeWallet] = updatedEmployee;

        for (uint i = 0; i < allEmployees.length; i++) {
            if (allEmployees[i].wallet == employeeWallet) {
                allEmployees[i] = updatedEmployee;
                return;
            }
        }
    }

    
    function getAllEmployees() public view returns (Employee[] memory) {
        return allEmployees;
    }
}
