// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "../interfaces/ITMS.sol";

error NOT_FOUND();

contract TMS is ITMS {
    address public owner;   
    string public companyName;

    constructor(string memory _companyName, address _owner) {
        _owner = owner;
        _companyName = companyName;
    }

    Teacher[] public Teachers;

    mapping(address => string) teacher_detail;

    receive() external payable {}

    fallback() external {}

    function RegisterTeacher(string memory _name, uint _salary, Status _status) external returns(Teacher[] memory) {
        Teacher memory new_teacher = Teacher({name: _name, salary: _salary, status: _status, wallet: msg.sender});
        Teachers.push(new_teacher);
        return Teachers;
    }

    function ViewTeachers() external view returns(Teacher[] memory) {
        return Teachers;
    }

    function PaySalary(string memory _name, address payable _to) external {
        bool found = false;
        for (uint i = 0; i < Teachers.length; i++) {
            if (keccak256(abi.encodePacked(Teachers[i].name)) == keccak256(abi.encodePacked(_name))) {
                require(
                    Teachers[i].status == Status.EMPLOYED || 
                    Teachers[i].status == Status.PROBATION, 
                    "Teacher not eligible for salary"
                );
                _to.transfer(Teachers[i].salary);
                found = true;
                break;
            }
        }

        if (!found) revert NOT_FOUND();
    }
}