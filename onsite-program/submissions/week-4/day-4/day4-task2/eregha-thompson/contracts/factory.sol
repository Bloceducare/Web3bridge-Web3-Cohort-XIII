// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import "./School.sol";

contract schoolFactory{
address[] allSchools;

function createFactory (address _schoolAddress) external{
   
    SchoolManagementSystem school = new SchoolManagementSystem(_schoolAddress);
    allSchools.push(address(school));
}

function getFactory() external view returns(address[] memory){
    return allSchools;
}
}