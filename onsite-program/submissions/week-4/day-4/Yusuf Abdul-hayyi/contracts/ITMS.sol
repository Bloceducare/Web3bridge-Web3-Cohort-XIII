//SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;


interface ITMS {
    
    enum EmployeeRole {
        Admin,
        Mentor,
        Security
    }

    enum Status {
        Employed,
        Unemployed,
        Probation
    }

    struct Staff {
        string name;
        uint256 amount;
        EmployeeRole role;
        Status status;
        address payable account;
    }

    function register_staff(address payable _account, string memory _name, uint _amount, Status _status, EmployeeRole _role) external payable;
}