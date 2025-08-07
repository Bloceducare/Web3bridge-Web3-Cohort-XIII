// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;
import "./Student.sol";

contract Factory {
  StudentRecord[] public studentArray;

  function createNewStudent() external {
    StudentRecord todo = new StudentRecord();
    studentArray.push(todo);
  }
}
