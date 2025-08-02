// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./IEmployeeManagement.sol";

contract EmployeeManagement {
    mapping(address => IEmployeeManagement.Employee) public employees;
    IEmployeeManagement.Employee[] public employeeList;

    event EmployeeAdded(address indexed employeeAddress, string name, IEmployeeManagement.Role role, uint256 salary);
    event SalaryDisbursed(address indexed employeeAddress, uint256 amount);
    event EmployeeStatusUpdated(address indexed employeeAddress, IEmployeeManagement.Status status);
    event EtherWithdrawn(address indexed caller, uint256 amount);

    error EmployeeAlreadyExists();
    error EmployeeNotFound();
    error InsufficientFunds();
    error InvalidSalary();
    error EmployeeNotActive();
    error InvalidAmount();

    function addEmployee(address _employeeAddress, string memory _name, IEmployeeManagement.Role _role, uint256 _salaryInEther) 
        external 
    {
        if (bytes(employees[_employeeAddress].name).length != 0) revert EmployeeAlreadyExists();
        if (_salaryInEther == 0) revert InvalidSalary();

        uint256 salaryInWei = _salaryInEther * 1 ether;

        IEmployeeManagement.Employee memory newEmployee = IEmployeeManagement.Employee({
            name: _name,
            role: _role,
            status: IEmployeeManagement.Status.ACTIVE,
            salary: salaryInWei,
            totalPaid: 0
        });

        employees[_employeeAddress] = newEmployee;
        employeeList.push(newEmployee);

        emit EmployeeAdded(_employeeAddress, _name, _role, salaryInWei);
    }

    function disburseSalary(address _employeeAddress) 
        external 
        payable 
    {
        IEmployeeManagement.Employee storage employee = employees[_employeeAddress];
        
        if (bytes(employee.name).length == 0) revert EmployeeNotFound();
        if (employee.status != IEmployeeManagement.Status.ACTIVE) revert EmployeeNotActive();
        if (msg.value != employee.salary) revert InsufficientFunds();
        if (address(this).balance < employee.salary) revert InsufficientFunds();

        (bool success, ) = _employeeAddress.call{value: employee.salary}("");
        if (!success) revert("Salary transfer failed");

        employee.totalPaid += employee.salary;
        
        emit SalaryDisbursed(_employeeAddress, employee.salary);
    }

    function canAccessGarage(address _employeeAddress) 
        external 
        view 
        returns (bool) 
    {
        IEmployeeManagement.Employee memory employee = employees[_employeeAddress];
        if (employee.status != IEmployeeManagement.Status.ACTIVE) {
            return false;
        }
        return true;
    }

    function getAllEmployees() 
        external 
        view 
        returns (IEmployeeManagement.Employee[] memory) 
    {
        return employeeList;
    }

    function getEmployeeDetails(address _employeeAddress) 
        external 
        view 
        returns (IEmployeeManagement.Employee memory) 
    {
        if (bytes(employees[_employeeAddress].name).length == 0) revert EmployeeNotFound();
        return employees[_employeeAddress];
    }


    function fundContract() 
        external 
        payable 
    {
        if (msg.value == 0) revert("Must send some Ether");
    }

    function withdrawExcessEther(uint256 _amountInEther) 
        external 
    {
        if (_amountInEther == 0) revert InvalidAmount();
        uint256 amountInWei = _amountInEther * 1 ether;
        if (address(this).balance < amountInWei) revert InsufficientFunds();

        (bool success, ) = msg.sender.call{value: amountInWei}("");
        if (!success) revert("Withdrawal failed");

        emit EtherWithdrawn(msg.sender, amountInWei);
    }

    function getContractBalance() 
        external 
        view 
        returns (uint256) 
    {
        return address(this).balance;
    }
}