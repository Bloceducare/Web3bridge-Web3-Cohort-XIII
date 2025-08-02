// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

interface ITMS {
    struct Teacher {
        string name;
        uint salary;
        Status status;
    }

    enum Status {
        EMPLOYED,
        UNEMPLOYED,
        PROBATION
    }

    function RegisterTeacher (string memory _name, uint _salary, Status _status) external returns(Teacher[] memory);
    function PaySalary (string memory _name, address payable to) external;
}