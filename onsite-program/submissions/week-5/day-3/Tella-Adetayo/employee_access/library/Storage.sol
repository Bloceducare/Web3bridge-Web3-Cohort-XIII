// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

library Storage {

    struct Employee {
        string name;
        bool isEmployed;
        Role role; 
        uint256 salary;
        uint256 paidSoFar; 
    }

    enum Role {
        MENTOR, 
        ADMIN, 
        SECURITY 
    }

    struct Layout {
        mapping(address => Employee) employee;
        address[] users;
        address owner; 
        address[] allAddr; 
    }

    bytes32 internal constant STORAGE_SLOT = keccak256("employee.storage");

    function layout() internal pure returns (Layout storage ds) {
        bytes32 slot = STORAGE_SLOT;
        assembly {
            ds.slot := slot
        }
    }
}