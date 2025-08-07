// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;
import "./SchoolManagementSystem.sol";

contract ERC20Factory{
    address[] private allSchools;
    mapping (address=>SchoolManagementSystem) private allSchoolsMapping;
    function createToken() external returns(address){
        SchoolManagementSystem newSchool = new SchoolManagementSystem();
        allSchools.push(address(newSchool));
        return address(newSchool);
    }
    function getTokenByAddress(address schoolAddress) external view returns (SchoolManagementSystem){
        return allSchoolsMapping[schoolAddress];
    }
    function getAllTokens() external view returns (address[] memory){
        return allSchools;
    }
}