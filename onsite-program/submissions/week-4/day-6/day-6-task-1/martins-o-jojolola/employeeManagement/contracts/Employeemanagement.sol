// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.28;

import {Employee, EmploymentStatus} from "../lib/Types.sol";
import "../lib/errors.sol";
import {IEmployeeManagement} from "./IEmployeeManagement.sol";

contract EmployeeManagement is IEmployeeManagement {
    mapping(address => Employee) private employees;
    address[] private owners;

    modifier employeeExists(address _employeeAddress) {
        if (!employees[_employeeAddress].exists) {
            revert Errors.EmployeeNotFound(_employeeAddress);
        }
        _;
    }

    modifier employeeDoesNotExist(address _employeeAddress) {
        if (employees[_employeeAddress].exists) {
            revert Errors.EmployeeAlreadyExists(_employeeAddress);
        }
        _;
    }

    function registerEmployee(
        address employeeAddress,
        string memory name,
        string memory subject,
        uint256 salaryAmount
    ) external employeeDoesNotExist(employeeAddress) {
        if (salaryAmount <= 0) {
            revert Errors.InvalidSalaryAmount();
        }

        employees[employeeAddress] = Employee({
            name: name,
            subject: subject,
            salaryAmount: salaryAmount,
            status: EmploymentStatus.UNEMPLOYED,
            registrationDate: block.timestamp,
            exists: true
        });
    }

    function updateEmploymentStatus(
        address employeeAddress,
        EmploymentStatus status
    ) external employeeExists(employeeAddress) {
        employees[employeeAddress].status = status;
    }

    function getEmployeeDetails(
        address employeeAddress
    ) external view employeeExists(employeeAddress) returns (Employee memory) {
        return employees[employeeAddress];
    }

    function isEligibleForSalary(
        address employeeAddress
    ) public view override employeeExists(employeeAddress) returns (bool) {
        Employee memory employee = employees[employeeAddress];
        return
            employee.status == EmploymentStatus.EMPLOYED ||
            employee.status == EmploymentStatus.PROBATION;
    }

    function disburseSalary(
        address employeeAddress
    ) external override employeeExists(employeeAddress) {
        Employee memory employee = employees[employeeAddress];

        if (
            employee.status != EmploymentStatus.EMPLOYED &&
            employee.status != EmploymentStatus.PROBATION
        ) {
            revert Errors.EmployeeNotEligible(employeeAddress, employee.status);
        }

        if (address(this).balance < employee.salaryAmount) {
            revert Errors.InsufficientFunds(
                employee.salaryAmount,
                address(this).balance
            );
        }

        (bool success, ) = payable(employeeAddress).call{
            value: employee.salaryAmount
        }("");
        if (!success) {
            revert Errors.TransferFailed(
                employeeAddress,
                employee.salaryAmount,
                "Transfer failed"
            );
        }
    }

    function getAllTeachers() external view returns (address[] memory) {
        return owners;
    }

    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
