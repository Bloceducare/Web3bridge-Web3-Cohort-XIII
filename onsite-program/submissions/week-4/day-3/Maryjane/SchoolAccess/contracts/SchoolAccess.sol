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

    function addEmployee( address _employeeWallet,string memory _employeeName,Role _employeeRole,bool _employeeStatus) public {
        require(employees[_employeeWallet].wallet == address(0), "Employee already exists");

        Employee memory newEmployee = Employee( _employeeName,_employeeRole,_employeeStatus,_employeeWallet);
        employees[_employeeWallet] = newEmployee;
        allEmployees.push(newEmployee);
    }

    function updateEmployee(address _employeeWallet,string memory _employeeName,Role _employeeRole,bool _employeeStatus) public {
        require(employees[_employeeWallet].wallet != address(0), "Employee does not exist");

        Employee memory updatedEmployee = Employee(_employeeName,_employeeRole,_employeeStatus,_employeeWallet);

        employees[_employeeWallet] = updatedEmployee;

        for (uint i = 0; i < allEmployees.length; i++) {
            if (allEmployees[i].wallet == _employeeWallet) {
                allEmployees[i] = updatedEmployee;
                return;
            }
        }
    }

    
    function getAllEmployees() public view returns (Employee[] memory) {
        return allEmployees;
    }
}
