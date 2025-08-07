// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import"./employee.sol";

contract employeeFactory{
    address[] employeeFactories;

    function createFactory( address owner) external{
        StudentSchool studentFactory = new StudentSchool( owner);
        employeeFactories.push(address(studentFactory));
    }

    function getAllFactories() external view returns(address[] memory){
        return employeeFactories;
    }
}