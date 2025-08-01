// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract Access {
    enum Role {
        MediaTeam,
        Mentor,
        Manager,
        SocialMediaTeam,
        TechnicianSupervisor,
        KitchenStaff
    }

    struct Employee {
        string name;
        Role role;
        bool isEmployed;
        address walletAddress; 
    }

    mapping(address => Employee) public employees;

    mapping(address => bool) public isRegistered;

    Employee[] public allEmployees;

    address public admin;

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    function addOrUpdateEmployee(
        address _employeeAddress,
        string memory _name,
        Role _role,
        bool _isEmployed
    ) public onlyAdmin {
        require(_employeeAddress != address(0), "Invalid address");
        require(bytes(_name).length != 0, "Name cannot be empty");

        Employee memory newEmployee = Employee({
            name: _name,
            role: _role,
            isEmployed: _isEmployed,
            walletAddress: _employeeAddress
        });

        bool exists = isRegistered[_employeeAddress];

        employees[_employeeAddress] = newEmployee;
        isRegistered[_employeeAddress] = true;

        if (exists) {
            for (uint i = 0; i < allEmployees.length; i++) {
                if (allEmployees[i].walletAddress == _employeeAddress) {
                    allEmployees[i] = newEmployee;
                    break;
                }
            }
        } else {
            allEmployees.push(newEmployee);
        }
    }

    function canAccessGarage(address _employeeAddress) public view returns (bool) {
        if (!isRegistered[_employeeAddress]) {
            return false;
        }

        Employee memory employee = employees[_employeeAddress];

        if (!employee.isEmployed) {
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

    function getEmployeeDetails(address _employeeAddress)
        public
        view
        returns (string memory name, Role role, bool isEmployed, address walletAddress)
    {
        require(isRegistered[_employeeAddress], "Employee not found");
        Employee memory employee = employees[_employeeAddress];
        return (employee.name, employee.role, employee.isEmployed, employee.walletAddress);
    }
}