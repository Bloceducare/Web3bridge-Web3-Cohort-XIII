// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;



enum EmployeeRole {
    MediaTeam,
    Mentors,
    Managers,
    SocialMediaTeam,
    TechnicianSupervisors,
    KitchenStaff
}

// we have to check if they are employed or not.
enum EmployeeStatus {
    Terminated,
    NotTerminated
}

// Defines a new type with two fields.
// Declaring a struct outside of a contract allows
// it to be shared by multiple contracts.
struct Employee {
    // uint id;
    string name;
    address walletAddress;
    EmployeeRole role;
    // bool hasDigitalKeyCard; // same as has access
    EmployeeStatus employeeStatus;
    bool hasAccess;
}

contract Web3BridgeGarage {

    Employee[] public allEmployees;

    // uint increment_id = 0; // following the first user that was added. --> For the incrementing of each employee that was added and also removed or updated.

    function getAllEmployees() public returns (Employee[] memory) {
        return allEmployees;
    }

    function addEmployee(string memory employee_name, address employee_address, EmployeeRole employee_role, EmployeeStatus employee_status) public {
        //  Data location can only be specified for array, struct or mapping types, but "memory" was given.
        allEmployees({
            name: employee_name,
            walletAddress: employee_address,
            role: employee_role
        })
    }

    function updateEmployee(string memory new_name, EmployeeRole new_role, EmployeeStatus new_status) {
    }

    function getEmployee(uint singleEmployeeId) public {
        /* Return the employee by any of these details:
            * Name,
            * Address,
            * Status (Terminated or not)
        */
    }
}