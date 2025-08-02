// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "../interfaces/ITMS.sol";

error NOT_FOUND();

contract TMS is ITMS {
    address owner;

    constructor() {
        owner = msg.sender;
    }

    Teacher[] public Teachers;

    mapping (address => Teacher[]) TeachersList;

    receive() external payable {}

    fallback() external {}

    function RegisterTeacher(string memory _name, uint _salary, Status _status) external returns(Teacher[] memory){
        Teacher memory new_teacher = Teacher({name: _name, salary: _salary, status: _status});
        Teachers.push(new_teacher);
    }

    function PaySalary(string memory _name, address payable _to) external {
        if (Teacher.salary_) {
            revert("NOT_FOUND"); 
        }
        Teacher memory salary_ = Teachers.salary;
        _to.transfer(salary_);
    }
}
