// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

interface ISalaryManagement {
    struct Teacher {
        address teacherAddress;
        uint256 salary;
        Status status;
    }

    enum Status {
        Probation,
        Employed,
        Unemployed
    }

    function registerTeacher(address _teacher, uint256 _salary, Status _status) external;

    function updateTeacherStatus(address _teacher, uint index, Status _status)  external;

    function paySalary(address _teacher, uint index) external;

    function getTeacherInfo(address _teacher, uint index) external  view returns (Teacher memory);
}