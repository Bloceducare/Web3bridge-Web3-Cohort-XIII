// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity 0.8.28;

import "../contracts/Student.sol";

contract Factory {
    struct SchoolInfo {
        address schoolContract;
        string schoolName;
        address owner;
        uint createdAt;
    }

    SchoolInfo[] public schools;
    mapping(address => address[]) public schoolsByOwner;
    mapping(address => bool) public isSchoolContract;

    function CreateSchool(string memory _schoolName) external returns (address) {
        require(bytes(_schoolName).length > 0, "School name cannot be empty");
        
        SchoolManagementSystem newSchool = new SchoolManagementSystem(_schoolName, msg.sender);
        address schoolAddress = address(newSchool);

        SchoolInfo memory schoolDetail = SchoolInfo({
            schoolContract: schoolAddress, 
            schoolName: _schoolName, 
            owner: msg.sender, 
            createdAt: block.timestamp
        });

        schools.push(schoolDetail);

        schoolsByOwner[msg.sender].push(schoolAddress);
        
        isSchoolContract[schoolAddress] = true;
        
        return schoolAddress;
    }

    function GetSchoolCount() external view returns (uint) {
        return schools.length;
    }

    function GetSchoolsByOwner(address owner) external view returns (address[] memory) {
        return schoolsByOwner[owner];
    }

    function GetSchoolInfo(uint schoolId) external view returns (address schoolContract, string memory schoolName, address owner, uint createdAt) {
        require(schoolId < schools.length, "School does not exist");
        SchoolInfo memory school = schools[schoolId];
        return (school.schoolContract, school.schoolName, school.owner, school.createdAt);
    }

    function GetAllSchools() external view returns (SchoolInfo[] memory) {
        return schools;
    }

    function IsValidSchool(address schoolAddress) external view returns (bool) {
        return isSchoolContract[schoolAddress];
    }
}