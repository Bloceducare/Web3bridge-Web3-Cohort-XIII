// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;


contract Web3BridgeGarageAccess {
    address public owner;

    enum Role {
        None,
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
        address wallet;
    }

    mapping(address => Employee) public employees;
    address[] public employeeAddresses;
    mapping(Role => bool) public roleHasGarageAccess;


    modifier onlyOwner() {
        require(msg.sender == owner, "Not contract owner");
        _;
    }

    constructor() {
        owner = msg.sender;
        // Set initial access rights upon deployment
        roleHasGarageAccess[Role.MediaTeam] = true;
        roleHasGarageAccess[Role.Mentors] = true;
        roleHasGarageAccess[Role.Managers] = true;
    }


    function addOrUpdateEmployee(address _wallet, string calldata _name, Role _role, bool _isEmployed) external onlyOwner {

        bool isNew = employees[_wallet].wallet == address(0);

        employees[_wallet] = Employee({
            name: _name,
            role: _role,
            isEmployed: _isEmployed,
            wallet: _wallet
        });

        if (isNew) {
            employeeAddresses.push(_wallet);
        }
    }


    function setGarageAccessForRole(Role _role, bool _canAccess) external onlyOwner {
        roleHasGarageAccess[_role] = _canAccess;
    }


    function canAccessGarage(address _wallet) external view returns (bool) {
        Employee memory emp = employees[_wallet];
        // An employee must be employed AND their role must have access.
        return emp.isEmployed && roleHasGarageAccess[emp.role];
    }


    function getAllEmployees() external view returns (Employee[] memory) {
        Employee[] memory all = new Employee[](employeeAddresses.length);
        for (uint i = 0; i < employeeAddresses.length; i++) {
            all[i] = employees[employeeAddresses[i]];
        }
        return all;
    }


    function getEmployee(address _wallet) external view returns (Employee memory) {
        return employees[_wallet];
    }
}