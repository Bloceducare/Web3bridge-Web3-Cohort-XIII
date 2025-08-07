// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "../library/Storage.sol";
import "../interface/IEmployee.sol"; 

contract Employee is IEmployee {
    using Storage for Storage.Layout; 

    constructor(address _owner) {
        Storage.Layout storage ds = Storage.layout(); 
        ds.owner = _owner; 
    }

    receive() external payable {}
    fallback() external payable {} 

    

    error CannotSelfDisburse(); 
    error AmountExceedsSalary(); 
    error InsufficientBalance();
    error UserNotFound();
    error UserAlreadyExist();
    error TransferFailed();

    event SalaryPaid(address indexed employee, uint256 amount); 

    modifier onlyOwner() {
        Storage.Layout storage ds = Storage.layout();
        require(msg.sender == ds.owner, "Only owner"); 
        _; 
    }

    function registerUser(string memory _name, Storage.Role _role, uint256 _salary) external {
        Storage.Layout storage ds = Storage.layout(); 
        if (ds.employee[msg.sender].salary != 0) {
            revert UserAlreadyExist();
        }
        ds.employee[msg.sender] = Storage.Employee({
            name: _name, 
            role: _role, 
            isEmployed: true, 
            paidSoFar: 0, 
            salary: _salary 
        });
        ds.users.push(msg.sender);
    } 

    function updateUser(string memory _name, Storage.Role _role, bool _isEmployed, uint256 _salary) external override {
        Storage.Layout storage ds = Storage.layout(); 
        Storage.Employee storage emp = ds.employee[msg.sender]; 

        emp.name = _name; 
        emp.role = _role; 
        emp.isEmployed = _isEmployed; 
        emp.salary = _salary; 
    }

    function getAllUsers() external view override returns (Storage.Employee[] memory) {
        Storage.Layout storage ds = Storage.layout(); 
        uint256 length = ds.users.length; 
        Storage.Employee[] memory allEmployees = new Storage.Employee[](length); 

        for (uint256 i; i < length; i++) {
            allEmployees[i] = ds.employee[ds.users[i]]; 
        }

        return allEmployees; 
    }

    function getUser(address _owner) external view returns (Storage.Employee memory) {
        Storage.Layout storage ds = Storage.layout(); 
        return ds.employee[_owner]; 
        
    }

    function disburseSalary(address payable _employee, uint256 _amount) external payable onlyOwner {
        Storage.Layout storage ds = Storage.layout(); 
        Storage.Employee memory employee = ds.employee[_employee]; 

        if (!ds.employee[_employee].isEmployed) {
            revert UserNotFound();
        }

        if (msg.sender == _employee) {
            revert CannotSelfDisburse(); 
        }

        if (_amount > ds.employee[_employee].salary) {
            revert AmountExceedsSalary(); 
        }

        (bool success, ) = _employee.call{value: _amount}(""); 
        if (!success) {
            revert TransferFailed();
        }
        employee.paidSoFar += _amount; 
        emit SalaryPaid(_employee, _amount); 
    }

    function withdraw(address payable _to, uint256 _amount) external onlyOwner {
        if (address(this).balance < _amount) {
            revert InsufficientBalance();
        }

        (bool success, ) = _to.call{value: _amount}(""); 
        require(success, "Withdraw failed");
    }

    function remainingSalary(address _employee) external view returns (uint256) {
        Storage.Layout storage ds = Storage.layout();
        Storage.Employee memory employee = ds.employee[_employee]; 
        return employee.salary - employee.paidSoFar; 
    }

    
}