
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "./StudentManagement.sol";

contract StudentManagementFactory {

  address[] students;

  function init(address _owner) external  {
    _owner = msg.sender;
    StudentManagement studentManagement = new StudentManagement(_owner);
    students.push(address(studentManagement));

  }

  function get_student_contract() external view returns (address[] memory) {

    return students;
  }

}
