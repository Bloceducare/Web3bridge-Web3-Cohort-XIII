//SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IEmployee {
    enum Status {
        Employed,
        Unemployed,
        Probation
    }

    struct Employee{
        address addr;
        string name;
        uint salary;
        Status status;
    }

    function createEmployee(address _userAddress, string memory name, uint salary) external;
    function updateEmployee(address _userAddress, string memory name, uint salary) external;
    function updateEmployeeStatus(address _userAddress, Status status) external;
    function deleteEmployee(address _userAddress) external;
    function getEmployeeByAddress(address _userAddress) external view returns(Employee memory);
    function getAllEmployees() external view returns(Employee[] memory);
}
