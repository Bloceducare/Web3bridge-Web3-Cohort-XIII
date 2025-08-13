// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

contract EmployeeManagement {
    // Custom errors for better gas efficiency and cleaner error messages
    error InvalidEmployeeAddress(string reason);
    error EmptyEmployeeName(string reason);
    error EmployeeNotFound(string reason);
    error EmployeeAlreadyExists(string reason);

    // Define roles employees can have
    enum ROLE {
        MEDIA_TEAM,
        MENTORS,
        MANAGERS,
        SOCIAL_MEDIA,
        TECHNICAL_SUPERVISORS,
        KITCHEN_STAFF
    }

    // Structure to hold details of each employee
    struct Employee {
        string name;
        ROLE role;
        string email;
        bool isEmployee; // used to check if this address belongs to a valid employee
    }

    // Mapping to store employees by their address
    mapping(address => Employee) private employees;

    // Keep track of all employee addresses for easy iteration
    address[] private employeeAddresses;

    // Modifier to make sure employee exists before certain operations
    modifier employeeExists(address _employeeAddress) {
        if (!employees[_employeeAddress].isEmployee) {
            revert EmployeeNotFound("Employee not found");
        }
        _;
    }

    // Modifier to ensure we don't add the same employee twice
    modifier employeeNotExists(address _employeeAddress) {
        if (employees[_employeeAddress].isEmployee) {
            revert EmployeeAlreadyExists("Employee already exists");
        }
        _;
    }

    // Add a new employee to the system
    function addEmployee(
        address _employeeAddress,
        string memory _name,
        ROLE _role,
        string memory _email
    ) external employeeNotExists(_employeeAddress) {
        // Check for valid name
        if (bytes(_name).length == 0) {
            revert EmptyEmployeeName("Employee name cannot be empty");
        }

        // Make sure address is not zero address
        if (_employeeAddress == address(0)) {
            revert InvalidEmployeeAddress("Employee address cannot be zero");
        }

        // Save employee data in the mapping
        employees[_employeeAddress] = Employee({
            name: _name,
            role: _role,
            email: _email,
            isEmployee: true
        });

        // Keep track of the address so we can loop over employees later
        employeeAddresses.push(_employeeAddress);
    }

    // Update existing employee details
    function updateEmployee(
        address _employeeAddress,
        string memory _name,
        ROLE _role,
        string memory _email
    ) external employeeExists(_employeeAddress) {
        // Name should not be empty
        if (bytes(_name).length == 0) {
            revert EmptyEmployeeName("Employee name cannot be empty");
        }

        // Update the employee record
        employees[_employeeAddress] = Employee({
            name: _name,
            role: _role,
            email: _email,
            isEmployee: true
        });
    }

    // Check if a specific employee has access to the garage
    function canAccessGarage(
        address _employeeAddress
    ) public view employeeExists(_employeeAddress) returns (bool) {
        ROLE role = employees[_employeeAddress].role;

        // Only specific roles are allowed access to the garage
        return (
            role == ROLE.MEDIA_TEAM ||
            role == ROLE.MENTORS ||
            role == ROLE.MANAGERS
        );
    }

    // Get full details of an employee, including if they can access the garage
    function getEmployeeDetails(
        address _employeeAddress
    )
        public
        view
        employeeExists(_employeeAddress)
        returns (
            string memory name,
            ROLE role,
            bool isEmployed,
            bool hasGarageAccess
        )
    {
        Employee memory employee = employees[_employeeAddress];
        return (
            employee.name,
            employee.role,
            employee.isEmployee,
            canAccessGarage(_employeeAddress)
        );
    }

    // Return an array of all employees in the system
    function getAllEmployees() external view returns (Employee[] memory) {
        Employee[] memory allEmployees = new Employee[](
            employeeAddresses.length
        );
        for (uint256 i = 0; i < employeeAddresses.length; i++) {
            allEmployees[i] = employees[employeeAddresses[i]];
        }
        return allEmployees;
    }

    // Get all employee wallet addresses
    function getEmployeeAddresses() external view returns (address[] memory) {
        return employeeAddresses;
    }
}
