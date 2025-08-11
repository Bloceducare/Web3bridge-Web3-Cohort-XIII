// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity 0.8.30;

interface ISalaryDisburser {
    function disburseSalary(address employee) external payable;
}

contract EmployeeManagement is ISalaryDisburser {
    enum EmployeeType { Mentor, Admin, Security }
    enum EmploymentStatus { Employed, Unemployed, Probation }

    struct Employee {
        uint256 agreedSalary;
        EmployeeType empType;
        EmploymentStatus status;
        bool exists;
    }

    mapping(address => Employee) public employees;
    address[] private employeeAddresses;
    address public owner;
    bool private initialized;

    error NotOwner();
    error EmployeeNotRegistered();
    error EmployeeNotEmployed();
    error InsufficientContractBalance();
    error ZeroAddress();
    error AlreadyRegistered();
    error InvalidSalary();
    error SalaryExceedsAgreedAmount();
    error AlreadyInitialized();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    function initialize() external {
        if (initialized) revert AlreadyInitialized();
        initialized = true;
        owner = msg.sender;
    }

    function registerEmployee(
        address _employee,
        uint256 _agreedSalary,
        EmployeeType _empType,
        EmploymentStatus _status
    ) external onlyOwner {
        if (_employee == address(0)) revert ZeroAddress();
        if (employees[_employee].exists) revert AlreadyRegistered();
        if (_agreedSalary == 0) revert InvalidSalary();

        employees[_employee] = Employee({
            agreedSalary: _agreedSalary,
            empType: _empType,
            status: _status,
            exists: true
        });

        employeeAddresses.push(_employee);
    }

    function updateEmployeeStatus(
        address _employee,
        EmploymentStatus _status
    ) external onlyOwner {
        if (!employees[_employee].exists) revert EmployeeNotRegistered();
        employees[_employee].status = _status;
    }

    function disburseSalary(address _employee) external payable override onlyOwner {
        if (!employees[_employee].exists) revert EmployeeNotRegistered();
        if (employees[_employee].status != EmploymentStatus.Employed) 
            revert EmployeeNotEmployed();
        if (msg.value > employees[_employee].agreedSalary) 
            revert SalaryExceedsAgreedAmount();
        if (address(this).balance < msg.value) 
            revert InsufficientContractBalance();

        (bool success, ) = _employee.call{value: msg.value}("");
        require(success, "Salary transfer failed");
    }

    function getAllEmployees() external view returns (address[] memory) {
        return employeeAddresses;
    }

    function depositFunds() external payable onlyOwner {
    }

    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
}