// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

 interface ICompany {
    struct Employee {
        string name;
        uint salary;
        Status status;
        address employeeAddress;
    }

    enum Status {
        ACTIVE,
        PROBATION,
        SACKED
    }


    function createEmployee(string memory _name) external ;
    function setEmployeeSalary(address _employeeAddress, uint amount) external;
    function paySalary(address _employeeAddress) external;
    function updateEmployeeStatus(address _employeeAddress, Status status) external;
    function updateEmployeeDetails(address _employeeAddress, string memory _name)external ;
    function updateEmployeeSalary(address _employeeAddress, uint _newSalary) external;

    
 }