// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.28;

library EmployeeData {
    enum Role { Managers, NonAcademicStaff, AcademicStaff }
    enum Status { Employed, Unemployed, Probation }

    struct Employee {
        uint uid;
        address employeeAddress;
        string name;
        Role role;
        Status status;
        uint256 salary;
    }

}