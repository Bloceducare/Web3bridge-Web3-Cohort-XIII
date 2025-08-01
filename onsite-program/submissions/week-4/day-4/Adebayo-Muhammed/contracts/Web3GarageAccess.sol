// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

contract Web3GarageAccess {

    enum Role {
        MediaTeam,
        Mentors, 
        Managers,
        SocialMediaTeam,
        TechnicianSupervisors,
        KitchenStaff
    }

    struct Employee {
        string name;
        Role role;
        bool isEmployed; 
    }

    mapping(address => Employee) public employees;

    address[] public allEmployees;

    address public owner;
    
    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner access");
        _;
    }

    function addEmployee(
        address employeeAddress, 
        string memory name, 
        Role role, 
        bool isEmployed
    ) public onlyOwner {

        bool isNewEmployee = true;
        for (uint i; i < allEmployees.length; i++) {
            if (allEmployees[i] == employeeAddress) {
                isNewEmployee = false;
                break;
            }
        }

        if (isNewEmployee) {
            allEmployees.push(employeeAddress);
        }

        employees[employeeAddress] = Employee(name, role, isEmployed);
    }

    function canAccessGarage(address employeeAddress) public view returns (bool) {
        Employee memory emp = employees[employeeAddress];
        
        if (!emp.isEmployed) {
            return false;
        }
        
        Role[3] memory allowedRoles = [Role.MediaTeam, Role.Mentors, Role.Managers];


        for (uint i; i < allowedRoles.length; i++) {
            if (emp.role == allowedRoles[i]) {
                return true;
            }
        }
        
        return false;
    }
    
    function getAllEmployees() public view returns (address[] memory) {
        return allEmployees;
    }
    
   
    function getEmployee(address employeeAddress) public view returns (
        string memory name,
        Role role,
        bool isEmployed,
        bool hasGarageAccess
    ) {
        Employee memory emp = employees[employeeAddress];
        return (
            emp.name,
            emp.role,
            emp.isEmployed,
            canAccessGarage(employeeAddress)
        );
    }
}