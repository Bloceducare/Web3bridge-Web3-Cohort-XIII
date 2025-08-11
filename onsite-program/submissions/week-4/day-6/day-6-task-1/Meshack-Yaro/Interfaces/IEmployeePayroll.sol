// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IEmployeePayroll {

    address public owner;

    struct Employee {
        string name;
        uint salary;
        address account;
        Status status;
        Role role;
    }


    enum Status {
        EMPLOYED, 
        UNEMPLOYED, 
        PROBATION
    }
    
   
    enum Role {
        ADMIN,
        MENTOR,
        SECURITY
    }

    function addEmployee(address _address, string memory _name, uint salary) external;
    
    function getAllEmployees() external view returns(Employee[] memory);

    function updateEmployee(address _address, string memory _name, uint salary) external;

    function payEmployee(address _to, uint _amount) external payable;

}