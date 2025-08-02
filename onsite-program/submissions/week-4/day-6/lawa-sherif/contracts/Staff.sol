// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

interface ISalary {
    enum Status {
        UNEMPLOYED,
        EMPLOYED,
        ON_PROBATION
    }
    
    struct StaffMember {
        uint256 id;
        address staffAddress;
        string name;
        uint256 salary;
        Status status;
        bool exists;
    }
    
}