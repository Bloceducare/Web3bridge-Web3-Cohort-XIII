// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.7.0 <0.9.0;

interface Ischool {
    function regTeacher(address _teacher, uint _salary)external;
    function updateTeacherStatus(address _teacher, Status _status) external;
    function payTeacher(address _teacher) external payable;
}

enum Status{
    Employed,
    UnEmployed,
    Probation
}

 struct Teacher {
        uint salary;
        Status status;
        bool employed;
        bool exists;
    }