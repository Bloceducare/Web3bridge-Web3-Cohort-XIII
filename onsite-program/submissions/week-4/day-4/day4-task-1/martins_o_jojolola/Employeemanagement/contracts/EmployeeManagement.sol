// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

contract EmployeeManagement {
    error InvalidEmployeeAddress(string reason);
    error EmptyEmployeeName(string reason);
    error EmployeeNotFound(string reason);

    enum ROLE {
        MEDIA_TEAM,
        MENTORS,
        MANAGERS,
        SOCIAL_MEDIA,
        TECHNICAL_SUPERVISORS,
        KITCHEN_STAFF
    }

    struct Employee {
        string name;
        ROLE role;
        string email;
        bool isEmployee;
    }

    mapping(address => Employee) public employees;
    address[] public employeeAddresses;

    modifier employeeExists(address _employeeAddress) {
        if (bytes(employees[_employeeAddress].name).length == 0) {
            revert EmployeeNotFound("Employee not found");
        }
        _;
    }

    function addEmployee(
        address _employeeAddress,
        string memory _name,
        ROLE _role,
        string memory _email
    ) external {
        if (bytes(_name).length == 0) {
            revert EmptyEmployeeName("Employee name cannot be empty");
        }
        if (_employeeAddress == address(0)) {
            revert InvalidEmployeeAddress("Employee address cannot be zero");
        }

        employees[_employeeAddress] = Employee({
            name: _name,
            role: _role,
            email: _email,
            isEmployee: true
        });

        employeeAddresses.push(_employeeAddress);
    }

    function updateEmployee(
        address _employeeAddress,
        string memory _name,
        ROLE _role,
        string memory _email
    ) external {
        if (!employees[_employeeAddress].isEmployee) {
            revert EmployeeNotFound("Employee not found");
        }
        if (bytes(_name).length == 0) {
            revert EmptyEmployeeName("Employee name cannot be empty");
        }
        if (_employeeAddress == address(0)) {
            revert InvalidEmployeeAddress("Employee address cannot be zero");
        }

        employees[_employeeAddress] = Employee({
            name: _name,
            role: _role,
            email: _email,
            isEmployee: true
        });
    }

    function canAccessGarage(
        address _employeeAddress
    ) public view returns (bool) {
        if (bytes(employees[_employeeAddress].name).length == 0) {
            revert EmployeeNotFound("Employee not found");
        }

        Employee memory employee = employees[_employeeAddress];

        if (!employee.isEmployee) {
            revert EmployeeNotFound("Employee not found");
        }

        return (employee.role == ROLE.MEDIA_TEAM ||
            employee.role == ROLE.MENTORS ||
            employee.role == ROLE.MANAGERS);
    }

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

    function getAllEmployees() external view returns (Employee[] memory) {
        Employee[] memory allEmployees = new Employee[](
            employeeAddresses.length
        );
        for (uint256 i = 0; i < employeeAddresses.length; i++) {
            allEmployees[i] = employees[employeeAddresses[i]];
        }
        return allEmployees;
    }
}
