// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract AccessManagementSystem {
    // Enum to represent all types of employees
    enum Role {
        MediaTeam,
        Mentor,
        Manager,
        SocialMediaTeam,
        TechnicianSupervisor,
        KitchenStaff,
        Terminated
    }

    // Struct to represent an employee
    struct Employee {
        string name;
        Role role;
        bool isEmployed;
    }

    // Mapping to associate wallet address with employee
    mapping(address => Employee) public employees;
    
    // Array to store all employees ever added
    Employee[] public allEmployees;

    // Event for employee addition/update
    event EmployeeUpdated(address indexed employeeAddress, string name, Role role, bool isEmployed);

    // Modifier to check if employee exists
    modifier employeeExists(address _employeeAddress) {
        require(bytes(employees[_employeeAddress].name).length != 0, "Employee does not exist");
        _;
    }

    // Function to add or update an employee
    function updateEmployee(
        address _employeeAddress,
        string memory _name,
        Role _role,
        bool _isEmployed
    ) public {
        // Input validation
        require(_employeeAddress != address(0), "Invalid address");
        require(bytes(_name).length > 0, "Name cannot be empty");

        // If employee doesn't exist in mapping, add to array
        if (bytes(employees[_employeeAddress].name).length == 0) {
            allEmployees.push(Employee(_name, _role, _isEmployed));
        }

        // Update employee in mapping
        employees[_employeeAddress] = Employee(_name, _role, _isEmployed);
        
        emit EmployeeUpdated(_employeeAddress, _name, _role, _isEmployed);
    }

    // Function to check if employee can access garage
    function canAccessGarage(address _employeeAddress) 
        public 
        view 
        employeeExists(_employeeAddress) 
        returns (bool) 
    {
        Employee memory employee = employees[_employeeAddress];
        
        // Check employment status
        if (!employee.isEmployed || employee.role == Role.Terminated) {
            return false;
        }

        // Check role for garage access
        return (employee.role == Role.MediaTeam || 
                employee.role == Role.Mentor || 
                employee.role == Role.Manager);
    }

    // Function to get all employees
    function getAllEmployees() public view returns (Employee[] memory) {
        return allEmployees;
    }

    // Function to get specific employee details
    function getEmployeeDetails(address _employeeAddress) 
        public 
        view 
        employeeExists(_employeeAddress) 
        returns (string memory, Role, bool) 
    {
        Employee memory employee = employees[_employeeAddress];
        return (employee.name, employee.role, employee.isEmployed);
    }
}