// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./ImanagementSysten.sol";

contract ManagementSystem is IManagementSystem {
    address public owner;
    mapping(address => Employee) public employees;
    address[] public employeeList;
    
    modifier onlyOwner() {
        if(msg.sender != owner) revert();
        _;
    }
    
    constructor() {
        owner = msg.sender;
    }
    
    receive() external payable {}
    
    function registerEmployee(
        address _employee,
        string memory _name,
        UserType _userType,
        uint256 _salary
    ) external override onlyOwner {
        if(_salary == 0) revert();
        if(employees[_employee].isEmployed) revert();
        
        employees[_employee] = Employee(_name, _userType, _salary, true);
        employeeList.push(_employee);
    }
    
    function paySalary(address _employee, uint256 _amount) external override onlyOwner {
        if(!employees[_employee].isEmployed) revert();
        if(_amount > employees[_employee].salary) revert();
        if(address(this).balance < _amount) revert();
        
        payable(_employee).transfer(_amount);
    }
    
    function getAllEmployees() external view override returns (address[] memory) {
        return employeeList;
    }
    
    function getEmployee(address _employee) external view override returns (Employee memory) {
        return employees[_employee];
    }
}