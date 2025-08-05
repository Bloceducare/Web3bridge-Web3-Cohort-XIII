// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "../interfaces/ISalaryManagement.sol";
import "../errors/Error.sol";

contract SalaryManagement is ISalaryManagement {
    
    mapping (address => Teacher[]) staffList;
    address admin;

    constructor() {
        admin = msg.sender;
    }

    function registerTeacher(address _teacher, uint256 _salary, Status _status) public {
        Teacher memory new_teacher = Teacher(_teacher, _salary, _status);
        staffList[_teacher].push(new_teacher);
    }

    function updateTeacherStatus(address _teacher, uint index, Status _status) public {
        staffList[_teacher][index].status = _status;
    }

    function paySalary(address _teacher, uint index) public {
        Teacher storage t = staffList[_teacher][index];
        if (t.status == Status.Employed) {
            (bool success, ) = _teacher.call{value: t.salary}("");
            if (!success) {
                revert ();
            }
        }
    }

    function getTeacherInfo(address _teacher, uint index) public view returns (Teacher memory) {
        return staffList[_teacher][index];
    }

}