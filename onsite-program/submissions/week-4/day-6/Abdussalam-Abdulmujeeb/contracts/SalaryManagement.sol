// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26; 

 error YOURE_A_THIEF();

contract SalaryManagement {
    // Define the Employee struct to store employee details

    address owner;
    struct Employee {
        string name;
        Role role;
        bool isActive;
    }
        constructor() {owner = msg.sender;}
    // Define the possible roles using an enum
    enum Role {
        Admin,
        Mentors,
        Security
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
        employees[_employeeAddress] = Employee(_name, _role, _isActive);

        allEmployees.push(employees[_employeeAddress]);
    }

    function can_receive_salary(address _employeeAddress)
        public
        view
        returns (bool)
    {
        Employee memory employee = employees[_employeeAddress];
        if (
            employee.role == Role.Admin ||
            employee.role == Role.Mentors ||
            employee.role == Role.Security
        ) {
            return true;
        }
        if (!employee.isActive) {
            return false;
        } else {
            return true;
        }
    }

    function transfer(address payable _to, uint256 _amount)
        external
        returns (address, uint256)
    {
        if (owner != msg.sender) revert YOURE_A_THIEF();
        require(can_receive_salary(msg.sender), "You are not eligible to receive salary");
        _to.transfer(_amount);
        return (_to, _amount);
    }
}
