// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.28;

import {Employee, EmploymentStatus} from "../lib/Types.sol";
import "../lib/errors.sol";
import {IEmployeeManagement} from "./IEmployeeManagement.sol";

contract EmployeeManagement is IEmployeeManagement {
    mapping(address => Employee) private employees;
    address[] private employeeAddresses;
    address private owner;

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

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

    // Allow contract to receive funds
    receive() external payable {}

    function registerEmployee(
        address employeeAddress,
        string memory name,
        string memory subject,
        uint256 salaryAmount
    ) external onlyOwner employeeDoesNotExist(employeeAddress) {
        if (salaryAmount == 0) {
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

        employeeAddresses.push(employeeAddress);
    }

    function updateEmploymentStatus(
        address employeeAddress,
        EmploymentStatus status
    ) external onlyOwner employeeExists(employeeAddress) {
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
    ) external override onlyOwner employeeExists(employeeAddress) {
        if (!isEligibleForSalary(employeeAddress)) {
            Employee memory employee = employees[employeeAddress];
            revert Errors.EmployeeNotEligible(employeeAddress, employee.status);
        }

        Employee memory employee = employees[employeeAddress];
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

    // Fixed function name and logic
    function getAllEmployees() external view returns (address[] memory) {
        return employeeAddresses;
    }

    // If you specifically need teachers, add this logic
    function getAllTeachers() external view returns (address[] memory) {
        uint256 teacherCount = 0;

        // First pass: count teachers
        for (uint256 i = 0; i < employeeAddresses.length; i++) {
            // Assuming teachers have "teacher" in their subject field
            if (
                keccak256(
                    abi.encodePacked(employees[employeeAddresses[i]].subject)
                ) == keccak256(abi.encodePacked("teacher"))
            ) {
                teacherCount++;
            }
        }

        // Second pass: collect teacher addresses
        address[] memory teachers = new address[](teacherCount);
        uint256 currentIndex = 0;

        for (uint256 i = 0; i < employeeAddresses.length; i++) {
            if (
                keccak256(
                    abi.encodePacked(employees[employeeAddresses[i]].subject)
                ) == keccak256(abi.encodePacked("teacher"))
            ) {
                teachers[currentIndex] = employeeAddresses[i];
                currentIndex++;
            }
        }

        return teachers;
    }

    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function getOwner() external view returns (address) {
        return owner;
    }
}
