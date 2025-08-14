// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.28;

enum EmploymentStatus {
    UNEMPLOYED,
    EMPLOYED,
    PROBATION
}

struct Employee {
    string name;
    string subject;
    uint256 salaryAmount;
    EmploymentStatus status;
    uint256 registrationDate;
    bool exists;
}
