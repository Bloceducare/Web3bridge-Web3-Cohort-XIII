// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract AccessMgt {
    struct Employee {
        string name;
        address employeeAddress;
        Role role;
        bool isEmployed;
    }

    enum Role {
        MediaTeam,
        Mentors,
        Managers,
        SocialMediaTeam,
        Technicians,
        KitchenStaff
    }

    Employee[] public employees;
    mapping(address => Employee) public roles;

    function add_and_update_Employee(
        string memory _name,
        Role _role,
        address _address
    ) external {
        require(_address != address(0), "Invalid address");
        if (roles[_address].isEmployed) {
            for (uint i; i < employees.length; i++) {
                if (employees[i].isEmployed == true) {
                    employees[i].name = _name;
                    employees[i].role = _role;
                }
            }
        } else {
            Employee memory newEmployee = Employee({
                name: _name,
                employeeAddress: _address,
                role: _role,
                isEmployed: true
            });
            employees.push(newEmployee);
            roles[_address] = newEmployee;
        }
    }

    function fullAccess(address _address) external view returns (bool) {
        return (
            (roles[_address].role == Role.MediaTeam ||
                roles[_address].role == Role.Mentors ||
                roles[_address].role == Role.Managers)
        );
    }

    function terminateEmployee(address _address) external {
        require(_address != address(0), "Invalid address");
        require(roles[_address].isEmployed, "Employee does not exist");
        roles[_address].isEmployed = false;
        for (uint i; i < employees.length; i++) {
            if (employees[i].employeeAddress == _address) {
                employees[i] = employees[employees.length - 1];
                employees.pop();
                return;
            }
        }
    }

    function getEmployees() external view returns (Employee[] memory) {
        return employees;
    }

    function getEmployeeCount() external view returns (uint) {
        return employees.length;
    }

    function getEmployeesById(
        address _address
    ) external view returns (Employee memory) {
        require(roles[_address].isEmployed, "Employee not found");
        return roles[_address];
    }
}
