// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract AccessGarage {

    enum Role {
        MediaTeam,
        Mentors,
        Managers,
        SocialMediaTeam,
        TechnicianSupervisors,
        KitchenStaff
    }

    struct Employee {
        string name;
        Role role;
        bool isEmployed;
        address wallet;
    }

    mapping(address => Employee) private employeeRecords;

    Employee[] private allEmployees;

    function UpdateOraddEmployee(
        address _wallet,
        string memory _name,
        Role _role,
        bool _isEmployed
    ) public {
        Employee memory newEmployee = Employee(_name, _role, _isEmployed, _wallet);
        employeeRecords[_wallet] = newEmployee;
        allEmployees.push(newEmployee);
    }

    function canAccessGarage(address _wallet) public view returns (bool) {
        Employee memory emp = employeeRecords[_wallet];

        if (!emp.isEmployed) {
            return false;
        }

        if (
            emp.role == Role.MediaTeam ||
            emp.role == Role.Mentors ||
            emp.role == Role.Managers
        ) {
            return true;
        }

        return false;
    }

    function getEmployee(address _wallet) public view returns (
        string memory name,
        Role role,
        bool isEmployed,
        address wallet
    ) {
        Employee memory emp = employeeRecords[_wallet];
        return (emp.name, emp.role, emp.isEmployed, emp.wallet);
    }

    function getAllEmployees() public view returns (Employee[] memory) {
        return allEmployees;
    }
}
