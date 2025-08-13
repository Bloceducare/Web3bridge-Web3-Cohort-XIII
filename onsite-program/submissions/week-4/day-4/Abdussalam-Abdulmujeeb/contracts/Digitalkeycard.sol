//SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

// creating an employee digital keycard to access Web3 Garage

contract Digitalkeycard {
    // Define the Employee struct to store employee details
    struct Employee {
        string name;
        Role role;
        bool isActive;
    }

    // Define the possible roles using an enum
    enum Role {
        MediaTeam,
        Mentor,
        Manager,
        SocialMediaTeam,
        TechnicianSupervisors,
        KitchenStaff
    }

    // Mapping to link wallet addresses to Employee structs
    mapping(address => Employee) public employees;

    Employee[] public allEmployees;

    function addEmployee(
        address _employeeAddress,
        string memory _name,
        Role _role,
        bool _isActive
    ) external {
        employees[_employeeAddress] = Employee(
            _name,
            _role,
            _isActive
        );
        
        allEmployees.push(employees[_employeeAddress]);
    }

        function canAccessGarage(address _employeeAddress) public view returns (bool) {
    Employee memory employee = employees[_employeeAddress];
    if (!employee.isActive) {
        return false;
    }
    if (
        employee.role == Role.MediaTeam ||
        employee.role == Role.Mentor ||
        employee.role == Role.Manager
    ) {
        return true;
    }
    return false;
}
    
    function getAllEmployees() public view returns (Employee[] memory) {
    return allEmployees;
}

    function getEmployeeDetails(address _employeeAddress) public view returns (Employee memory) {
    Employee memory employee = employees[_employeeAddress];
    return employee;
}
}
