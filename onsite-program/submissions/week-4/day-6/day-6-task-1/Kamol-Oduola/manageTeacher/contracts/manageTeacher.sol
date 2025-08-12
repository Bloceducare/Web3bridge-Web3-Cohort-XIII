// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.7.0 <0.9.0;

import "./iSchool.sol";

error NotAuthorised();
error NotEmployed();
error TeacherNotFound();

contract ManageTeacher is Ischool {
    address public admin;

    mapping(address => Teacher) public teachers;

    modifier onlyAdmin() {
        if (msg.sender != admin) revert NotAuthorised();
        _;
    }

    modifier onlyEmployed(address teacherAddress) {
        if (!teachers[teacherAddress].employed) revert NotEmployed();
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    function regTeacher(address _teacher, uint _salary) external onlyAdmin {
        teachers[_teacher] = Teacher({
            salary: _salary,
            status: Status.Employed,
            employed: true,
            exists: true
        });
    }

    function updateTeacherStatus(address _teacher, Status _status) external onlyAdmin {
        if (!teachers[_teacher].exists) revert TeacherNotFound();
        teachers[_teacher].status = _status;
    }

    function payTeacher(address _teacher) external payable onlyAdmin {
        Teacher memory t = teachers[_teacher];
        if (!t.exists) revert TeacherNotFound();
        if (t.status != Status.Employed) revert NotEmployed();

        payable(_teacher).transfer(t.salary);
    }

    function getTeacher(address _teacher) external view returns (Teacher memory) {
        return teachers[_teacher];
    }

    // Fallback to receive ETH
    receive() external payable {}
}
