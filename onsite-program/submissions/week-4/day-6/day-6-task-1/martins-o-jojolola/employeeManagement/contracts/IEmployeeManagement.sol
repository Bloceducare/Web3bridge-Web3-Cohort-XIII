// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {Employee, EmploymentStatus} from "../lib/Types.sol";
import "../lib/errors.sol";

interface IEmployeeManagement {
    function registerEmployee(
        address employeeAddress,
        string memory name,
        string memory subject,
        uint256 salaryAmount
    ) external;

    function updateEmploymentStatus(
        address employeeAddress,
        EmploymentStatus status
    ) external;

    function getEmployeeDetails(
        address employeeAddress
    ) external view returns (Employee memory);

    function isEligibleForSalary(
        address employeeAddress
    ) external view returns (bool);

    function disburseSalary(address employeeAddress) external;

    function getContractBalance() external view returns (uint256);
}
