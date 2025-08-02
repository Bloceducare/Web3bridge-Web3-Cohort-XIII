// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

// Uncomment this line to use console.log
// import "hardhat/console.sol";


import "./IEmployee.sol";
import "./Error.sol";

contract Employee {
    
    enum Status {
        EMPLOYED,
        UNEMPLOYED,
        PROBATION,
        TERMINATED
    }

    enum Role {
        MENTORS,
        KITCHEN_STAFF,
        SECURITY_STAFF
    }

    

    struct EmployeeData {
        string name;
        Role role;
        Status status;
        uint256 salary;
        address payable employeeAddress;
        bool exists;
    }
    
    mapping(address => EmployeeData) employee_map;

    mapping(Role => uint256) public roleSalaries;
    
    
   
    address[] public employee_addresses;


 

    address private owner;

   constructor() {
        owner = msg.sender;
    }
    
    modifier onlyAdmin() {
        if (owner != msg.sender) {
            revert Error.NOT_ADMIN();
        }
        _;
    }
    
    modifier employeeExists(address _employee) {
        if (!employee_map[_employee].exists) {
            revert Error.EMPLOYEE_NOT_FOUND();
        }
        _;
    }
    

    function create_employee(
        string memory _name, 
        Role _role, 
        Status _status, 
        address payable _address
        uint _salary
    ) external onlyAdmin 
    
    {
        if (bytes(_name).length <= 3) {
            revert Error.INVALID_NAME();
        }
        
        
        require(!employee_map[_address].exists, "Employee already exists");
        
        EmployeeData memory new_employee = EmployeeData({
            name: _name,
            role: _role,
            status: _status,
            employeeAddress: _address,
            exists: true
        });
        
        employee_map[_address] = new_employee;
        employee_addresses.push(_address);
    }


 function transferSalary(address _employee) 
        external 
        onlyAdmin 
        employeeExists(_employee) 
        returns (bool)
    {
        EmployeeData storage emp = employees[_employee];
        
        require(
            emp.status == Status.PROBATION || emp.status == Status.TERMINATED, 
            "Employee not eligible for salary"
        );
        
        uint256 salaryAmount = getEmployeeSalary(_employee);
        
        if (address(this).balance < salaryAmount) {
            revert Error.INSUFFICIENT_BALANCE();
        }
        
        emp.balance += salaryAmount;
        emp.lastPaymentTime = block.timestamp;
        
        
        (bool success, ) = _employee.call{value: salaryAmount}("");
        if (!success) {
            revert Error.TRANSFER_FAILED();
        }
        

    }
}
