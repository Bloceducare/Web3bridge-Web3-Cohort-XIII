// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.30;

interface EmployeeManagement {
    function transfer(address recipient, uint amount) external;
    function registerUser(string memory user_name, address user_address) external;
    struct Employee {string name; UserType employee_type; uint salary; address employee_address;}
    enum UserType { mentor, admin, security}
    enum Status {employed,unemployed,onProbation}
}

contract Ether {
    address payable recipient;
    // constructor() { user = }
}

contract EmployeeManagementSystem{

    function payStaffSalary() virtual public {
        // check if the staff we are paying too is still 
        // employed...(not unemployed or on probation)
    }    
}
