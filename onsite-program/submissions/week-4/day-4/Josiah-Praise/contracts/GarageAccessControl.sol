// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

contract GarageAccessControl {
    mapping(address => Employee) private s_employees;
    Employee[] private s_allEmployees;

    enum Role {
        MANAGER,
        MENTOR,
        MEDIA_TEAM,
        SOCIAL_MEDIA_TEAM,
        TECHNICIAN_SUPERVISOR,
        KITCHEN_STAFF
    }

    enum Status {
        ACTIVE,
        TERMINATED
    }

    struct Employee {
        string name;
        address employeeAddress;
        Role role;
        Status status;
        bool exists;
    }

    error GarageAccessControl__Unauthorized();
    error GarageAccessControl__NotFound();

    event EmployeeSet(address indexed employeeAddress, string name, Role role, Status status);

    constructor() {
        Employee memory manager = Employee({
            name: "Praise Josiah",
            employeeAddress: 0xa5526DF9eB2016D3624B4DC36a91608797B5b6d5,
            role: Role.MANAGER,
            status: Status.ACTIVE,
            exists: true
        });

        s_employees[msg.sender] = manager;
        s_allEmployees.push(manager);

        emit EmployeeSet(msg.sender, "Initial Manager", Role.MANAGER, Status.ACTIVE);
    }

    modifier onlyManager() {
        Employee storage caller = s_employees[msg.sender];
        if (!caller.exists || caller.role != Role.MANAGER || caller.status != Status.ACTIVE) {
            revert GarageAccessControl__Unauthorized();
        }
        _;
    }

    function canAccessGarage(address _employeeAddress) external view returns (bool) {
        if (!s_employees[_employeeAddress].exists) {
            return false;
        }

        Employee memory employee = s_employees[_employeeAddress];

        if (employee.status == Status.TERMINATED) {
            return false;
        }

        bool hasAccessRole = employee.role == Role.MANAGER ||
            employee.role == Role.MENTOR ||
            employee.role == Role.MEDIA_TEAM;

        return hasAccessRole;
    }

    function setEmployee(
        address _employeeAddress,
        string calldata _name,
        Role _role,
        Status _status
    ) external onlyManager {
        Employee memory employee = Employee({
            name: _name,
            employeeAddress: _employeeAddress,
            role: _role,
            status: _status,
            exists: true
        });

        if (s_employees[_employeeAddress].exists) {
            uint index = _findIndex(_employeeAddress);
            s_allEmployees[index] = employee;
        } else {
            s_allEmployees.push(employee);
        }

        s_employees[_employeeAddress] = employee;
        
        emit EmployeeSet(_employeeAddress, _name, _role, _status);
    }

    function getEmployee(address _employeeAddress) external view returns (Employee memory) {
        if (!s_employees[_employeeAddress].exists) {
            revert GarageAccessControl__NotFound();
        }
        return s_employees[_employeeAddress];
    }

    function getAllEmployees() external view returns (Employee[] memory) {
        return s_allEmployees;
    }

    function _findIndex(address _employeeAddress) private view returns (uint) {
        for (uint i = 0; i < s_allEmployees.length; i++) {
            if (s_allEmployees[i].employeeAddress == _employeeAddress) {
                return i;
            }
        }
        revert GarageAccessControl__NotFound();
    }
}
