// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.28;

import {Employee, EmploymentStatus} from "../lib/Types.sol";

library Errors {
    error EmployeeNotFound(address teacherAddress);
    error EmployeeAlreadyExists(address teacherAddress);
    error NotAuthorized(address sender);
    error InsufficientFunds(uint256 required, uint256 available);
    error InvalidSalaryAmount();
    error EmployeeNotEligible(address teacherAddress, EmploymentStatus status);
    error EmptyTeachersList();
    error TransferFailed(address recipient, uint256 amount, string reason);
}
