// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./StudentManagement.sol";

contract StudentFactory {
    SchoolManagement[] public schools;

    function createSchool() external returns (address) {
        SchoolManagement newSchool = new SchoolManagement();
        schools.push(newSchool);
        return address(newSchool);
    }

    function getAllStudents(address _schoolAddress) external view returns (SchoolManagement.Student[] memory) {
        return SchoolManagement(_schoolAddress).getAllStudents();
    }
}