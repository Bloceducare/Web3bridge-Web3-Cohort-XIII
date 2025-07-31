// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract Web3BridgeGarage {

    enum Role { 
        MEDIATEAM,
        MENTORS, 
        MANAGERS, 
        SOCIALMEDIATeam, 
        TECHNICIANSUPERVISORS, 
        KITCHENSTAFF }

    enum Status { 
        ACTIVE, 
        INACTIVE, 
        TERMINATED }

    struct Employee {
        string name;
        Role role;
        Status status;
    }

    mapping(address => Employee) public employees;
    Employee[] public employeeList;

    function addEmployee(address _employeeAddress, string memory _name, Role _role) external {
        require(bytes(employees[_employeeAddress].name).length == 0, "Employee already exists");
        Employee memory newEmployee = Employee({
            name: _name,
            role: _role,
            status: Status.ACTIVE
        });
        employees[_employeeAddress] = newEmployee;
        employeeList.push(newEmployee);
    }

   
   
}