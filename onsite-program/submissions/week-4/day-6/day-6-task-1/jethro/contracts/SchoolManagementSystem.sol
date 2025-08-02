// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;


interface ISalaryDisburser {
    function disburseSalary(address employee, uint256 amount) external;
}


contract SchoolManagementSystem is ISalaryDisburser {
    
    enum Role { Teacher, Administrator, SupportStaff }


    enum EmploymentStatus { Active, Inactive, Terminated }


    struct Employee {
        string name;
        Role role;
        EmploymentStatus status;
        uint256 salary;
        address payable employeeAddress;
    }

    
    mapping(address => Employee) public employees;
    
    
    mapping(address => bool) public isRegistered;
    
    
    uint256 public totalEmployees;
    
    
    address public owner;
    
    constructor() {
        owner = msg.sender;
    }
    
    
    function registerEmployee(
        address payable _employeeAddress,
        string memory _name,
        Role _role,
        uint256 _salary
    ) public {
        require(msg.sender == owner, "Only owner can call this function");
        require(!isRegistered[_employeeAddress], "Employee already registered");
        
        employees[_employeeAddress] = Employee({
            name: _name,
            role: _role,
            status: EmploymentStatus.Active,
            salary: _salary,
            employeeAddress: _employeeAddress
        });
        
        isRegistered[_employeeAddress] = true;
        totalEmployees++;
    }
    

    function updateEmployeeStatus(
        address _employeeAddress,
        EmploymentStatus _status
    ) public {
        require(msg.sender == owner, "Only owner can call this function");
        require(isRegistered[_employeeAddress], "Employee not registered");
        employees[_employeeAddress].status = _status;
    }
    
    
    function disburseSalary(address _employeeAddress, uint256 _amount)
        public
        override
    {
        require(msg.sender == owner, "Only owner can call this function");
        require(isRegistered[_employeeAddress], "Employee not registered");
        Employee storage employee = employees[_employeeAddress];
        
        require(employee.status == EmploymentStatus.Active, "Employee is not active");
        require(_amount <= employee.salary, "Amount exceeds salary");
        require(address(this).balance >= _amount, "Insufficient contract balance");
        
        employee.employeeAddress.transfer(_amount);
    }
    
    
    function getEmployeeDetails(address _employeeAddress)
        public
        view
        returns (
            string memory name,
            Role role,
            EmploymentStatus status,
            uint256 salary
        )
    {
        require(isRegistered[_employeeAddress], "Employee not registered");
        Employee memory employee = employees[_employeeAddress];
        return (
            employee.name,
            employee.role,
            employee.status,
            employee.salary
        );
    }
    
    
    function fundContract() public payable {
        require(msg.sender == owner, "Only owner can call this function");
        require(msg.value > 0, "Must send some Ether");
    }
    
    
    function getContractBalance() public view returns (uint256) {
        return address(this).balance;
    }
}