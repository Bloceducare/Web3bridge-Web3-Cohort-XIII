//SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;
import "../Interface/EmployeeInterface.sol";


error NotOwner();
error EmployeeAlreadyExists();
error EmployeeDoesNotExist();
error InvalidAddress();
error InsufficientContractBalance();
error NotPayableStatus();
error SalaryTransferFailed();

contract EmployeeSystem is IEmployee {
    mapping(address => Employee) public employees;
    address[] private allEmployeeAddresses;
    Employee[] private allEmployees;
    address owner;

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    function createEmployee(address _userAddress, string memory name, uint salary) external onlyOwner {
        if (_userAddress == address(0)) revert InvalidAddress();
        if (employees[_userAddress].addr != address(0)) revert EmployeeAlreadyExists();

        employees[msg.sender] = Employee(_userAddress, name, salary, Status.Employed);
        allEmployees.push(Employee(_userAddress, name, salary, Status.Employed));
    }

    function updateEmployee(address _userAddress, string memory name, uint salary) external {
        if (_userAddress == address(0)) revert InvalidAddress();
        if (employees[_userAddress].addr == address(0)) revert EmployeeDoesNotExist();

        Employee storage employee = employees[_userAddress];
        employee.name = name;
        employee.salary = salary;
    }

    function updateEmployeeStatus(address _userAddress, Status status) external {
        if (_userAddress == address(0)) revert InvalidAddress();
        if (employees[_userAddress].addr == address(0)) revert EmployeeDoesNotExist();

        Employee storage employee = employees[_userAddress];
        employee.status = status;
    }

    function deleteEmployee(address _userAddress) external {
        if (_userAddress == address(0)) revert InvalidAddress();
        if (employees[_userAddress].addr == address(0)) revert EmployeeDoesNotExist();

        delete employees[_userAddress];

        for (uint i = 0; i < allEmployeeAddresses.length; i++) {
            if (allEmployeeAddresses[i] == _userAddress) {
                allEmployeeAddresses[i] = allEmployeeAddresses[allEmployeeAddresses.length - 1];
                allEmployeeAddresses.pop();
                break;
            }
        }
    }

    function getEmployeeByAddress(address _userAddress) external view returns (Employee memory) {
        if (_userAddress == address(0)) revert InvalidAddress();
        if (employees[_userAddress].addr == address(0)) revert EmployeeDoesNotExist();

        return employees[_userAddress];
    }

    function getAllEmployees() external view returns(Employee[] memory) {
        return allEmployees;
    }

    function paySalary(address _userAddress) external onlyOwner {
        if (_userAddress == address(0)) revert InvalidAddress();
        if (employees[_userAddress].addr == address(0)) revert EmployeeDoesNotExist();

        Employee storage employee = employees[_userAddress];
        if (employee.status == Status.Unemployed) revert NotPayableStatus();
        if (address(this).balance < employee.salary) revert InsufficientContractBalance();

        (bool success, ) = _userAddress.call{value: employee.salary}("");
        if (!success) revert SalaryTransferFailed();

    }

    receive() external payable { }
    fallback() external payable { }
}
