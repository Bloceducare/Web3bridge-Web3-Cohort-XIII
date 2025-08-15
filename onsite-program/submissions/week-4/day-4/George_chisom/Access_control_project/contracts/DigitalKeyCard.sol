// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.30;

contract DigitalKeyCard {

    enum EmployeeRole {
        MediaTeam,
        Mentors,
        Managers,
        SocialMediaTeam,
        TechnicianSupervisors,
        KitchenStaff
    }

    // Updated struct to include address
    struct Employee {
        address employeeAddress; // Added to store wallet address
        string name;
        EmployeeRole role;
        bool isEmployed;
    }

    error STOP();

    mapping(address => Employee) public employees;
    Employee[] public allEmployees;


    // Updated addEmployee to store address in struct
    function addEmployee( address _employeeAddress, string memory _name, EmployeeRole _role ) external {
        Employee memory newEmployee = Employee({
            employeeAddress: _employeeAddress, // Store address
            name: _name,
            role: _role,
            isEmployed: true
        });

        employees[_employeeAddress] = newEmployee;

        allEmployees.push(newEmployee);

    }

    // Updated function using address in loop
    function updateEmployee( address _employeeAddress, string memory _name, EmployeeRole _role, bool _isEmployed ) external {
        // Check if the employee exists
        require(bytes(employees[_employeeAddress].name).length > 0, "Employee not found");

        // Update the employee’s details in the mapping
        employees[_employeeAddress].name = _name;
        employees[_employeeAddress].role = _role;
        employees[_employeeAddress].isEmployed = _isEmployed;

        // Loop through allEmployees to find and update the matching record
        for (uint i = 0; i < allEmployees.length; i++) {
            if (allEmployees[i].employeeAddress == _employeeAddress) {
                allEmployees[i].name = _name;
                allEmployees[i].role = _role;
                allEmployees[i].isEmployed = _isEmployed;
                revert STOP(); // Stop once updated
            }
        }

    }

    // Other functions remain unchanged
    function canAccessGarage(address _employeeAddress) external view returns (bool) {
        Employee memory employee = employees[_employeeAddress];
        if (!employee.isEmployed) {
            return false;
        }
        if (
            employee.role == EmployeeRole.MediaTeam ||
            employee.role == EmployeeRole.Mentors ||
            employee.role == EmployeeRole.Managers
        ) {
            return true;
        }
        return false;
    }

    function getAllEmployees() external view returns (Employee[] memory) {
        return allEmployees;
    }

    function getEmployeeDetails(address _employeeAddress) external view returns (Employee memory) {
        require(bytes(employees[_employeeAddress].name).length > 0, "Employee not found");
        return employees[_employeeAddress];
    }
}