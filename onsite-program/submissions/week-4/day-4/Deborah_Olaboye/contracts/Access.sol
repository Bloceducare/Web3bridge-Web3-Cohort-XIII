// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract Access {
    struct Employee {
        string name;
        Role role;
        bool isEmployed;
        EmployeeType employeeType;
    }

    enum Role {
        Media_Team,
        Mentors,
        Managers,
        Social_Media_Team,
        Technician_Supervisors,
        Kitchen_Staff
    }

    enum EmployeeType {
        CAN_ACCESS,
        CANNOT_ACCESS,
        TERMINATED
    }

    mapping(address => Employee) public employees;
    
    Employee[] public Employees;

    function AddEmployee (address _employeeAddress, string memory _name, Role _role, bool _isEmployed) external {
        EmployeeType _employeeType;

        if (!_isEmployed) {
            _employeeType = EmployeeType.TERMINATED;
        } else if (_role == Role.Media_Team || _role == Role.Mentors || _role == Role.Managers) {
            _employeeType = EmployeeType.CAN_ACCESS;
        } else {
            _employeeType = EmployeeType.CANNOT_ACCESS;
        }

        employees[_employeeAddress] = Employee({name: _name, role: _role, isEmployed: _isEmployed, employeeType: _employeeType});

        Employees.push(Employee({name: _name, role: _role, isEmployed: _isEmployed, employeeType: _employeeType}));

    }

    function UpdateEmployee (address _employeeAddress, string memory _new_name, Role _new_role, bool _isEmployed) external {
        EmployeeType _employeeType;

        if (!_isEmployed) {
            _employeeType = EmployeeType.TERMINATED;
        } else if (_new_role == Role.Media_Team || _new_role == Role.Mentors || _new_role == Role.Managers) {
            _employeeType = EmployeeType.CAN_ACCESS;
        } else {
            _employeeType = EmployeeType.CANNOT_ACCESS;
        }

        employees[_employeeAddress] = Employee({name: _new_name, role: _new_role, isEmployed: _isEmployed, employeeType: _employeeType});
    }

    function EmployeesList () external view returns (Employee[] memory) {
        return Employees;
    }

    function getEmployeeDetail(address _employeeAddress) public view returns (Employee memory) {
        return employees[_employeeAddress];
    }

    function canAccessGarage(address _employeeAddress) public view returns (bool) {
        Employee memory employee = employees[_employeeAddress];
        
        return employee.employeeType == EmployeeType.CAN_ACCESS;
    }
}
