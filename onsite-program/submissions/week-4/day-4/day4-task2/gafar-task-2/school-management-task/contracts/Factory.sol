// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;
import "./Student.sol";

contract Factory {
  StudentRecord[] public studentArray;

  function registerStudent(uint256 studentIndex, string memory name, uint age) external {
    return StudentRecord(address(studentArray[studentIndex])).register_student(name, age);
  }

  function updateStudent(uint256 studentIndex, string memory name, uint age, StudentStatus status) external {
    return StudentRecord(address(studentArray[studentIndex])).update_student(name, age, status);
  }

  function deleteStudent(uint256 studentIndex) external {
    return StudentRecord(address(studentArray[studentIndex])).remove_student();
  }

  function getStudent(uint256 studentIndex, address _address) external view returns(Student memory) {
    return StudentRecord(address(studentArray[studentIndex])).get_student_by_id(_address);
  }

  function getAllStudent(uint256 studentIndex) external view returns(Student[] memory) {
    return StudentRecord(address(studentArray[studentIndex])).get_all_students();
  }
}
