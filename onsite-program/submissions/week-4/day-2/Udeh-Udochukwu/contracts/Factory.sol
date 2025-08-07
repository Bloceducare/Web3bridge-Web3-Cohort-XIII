// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;


// Basic Factory Contract for School
contract SchoolFactory {
    event SchoolCreated(address indexed schoolAddress, address indexed creator);

    address[] public deployedSchools;

    function createSchool() external returns (address) {
        School newSchool = new School();
        address schoolAddress = address(newSchool);
        
        deployedSchools.push(schoolAddress);
        
        emit SchoolCreated(schoolAddress, msg.sender);
        
        return schoolAddress;
    }

    function getDeployedSchools() external view returns (address[] memory) {
        return deployedSchools;
    }

    function getDeployedSchoolsCount() external view returns (uint256) {
        return deployedSchools.length;
    }
}