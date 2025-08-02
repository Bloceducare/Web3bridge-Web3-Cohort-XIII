// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IEmployeeManagement {
    enum EmployeePosition {MENTOR, ADMIN, SECURITY}
    enum Status{EMPLOYED, PROBATION, TERMINATED}
    struct Employee {
        string name;
        address _address;
        uint256 salary;
        EmployeePosition position;
        Status status;
    }
    function addEmployee(string memory _name, address _address, EmployeePosition _position, uint256 _salary) external;
    function payEmployee(address _address) external;
}