// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "./School.sol";

contract SchoolManagementSystemFactory {
    address[] public schools;

    function createSchoolManagementSystem() external returns (address) {
        SchoolManagementSystem school = new SchoolManagementSystem();
        schools.push(address(school));
        return address(school);
    }

    function getAllSchools() external view returns (address[] memory) {
        return schools;
    }
}
