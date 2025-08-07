// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.30;
import "./StudentManagement.sol";

contract studentManagementFactory {
    address [] studentManagementAddress;

    function createStudentMangementContract() external {
        StudentManagement studentManagement =  new StudentManagement();

        address newStudentManagementAddress = address(studentManagement);

        studentManagementAddress.push(newStudentManagementAddress);
    }

    function getAllStudentManagementAddress () external view returns (address[] memory) {
        return studentManagementAddress;
    }
}