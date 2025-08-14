// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.28;

import { EmployeeData } from "../libraries/Data.sol";
import "../interface/EmployeeInterface.sol";

contract EmployeeManagement is iEmployeeInterface {
    

    EmployeeData.Employee[] public EmployeeList;
 
    address owner;

    mapping(address => EmployeeData.Employee) public Employees;

    uint256 private uniqueId;
    uint256 public amount;
    mapping(address => uint256) private walletBalances;


    constructor() {
        owner = msg.sender;
    }

    error Access_Denied();
    error DontPay();
    error STOP();

    // function to register_employee
    function register_employee (string memory _name, address _employeeAddress, EmployeeData.Role _role) external {
        uniqueId = uniqueId + 1;
        amount = 100000;
        
        EmployeeData.Employee memory _newEmployee = EmployeeData.Employee(uniqueId, _employeeAddress, _name, _role, EmployeeData.Status.Employed, amount);

        EmployeeList.push(_newEmployee);
        Employees[msg.sender] = _newEmployee;
    }

    function update_salary(address _employeeAddress) external {
        uint256 managerAmount = 200000;
        uint256 nonAcademicStaff = 100000;
        uint256 AcademicStaff = 150000;
        
        EmployeeData.Employee storage employee = Employees[_employeeAddress];

        if (employee.role == EmployeeData.Role.Managers){
            employee.salary = managerAmount;
        } else if (employee.role == EmployeeData.Role.NonAcademicStaff){
            employee.salary = nonAcademicStaff;
        } else {
            employee.salary == AcademicStaff;
        }
    }
    

    function pay_salary(address payable _to, uint256 _amount) external {
        require(msg.sender == owner, "Only owner can pay salary");
        require(Employees[_to].status == EmployeeData.Status.Employed, "Employee must be employed");
        require(_amount > 0, "Amount must be greater than zero");
        
        _to.transfer(_amount);

        walletBalances[_to] = walletBalances[_to] + _amount;
    }

    function get_balance(address _employee_address) external view returns(uint256) {
        if (_employee_address == address(0)) {
            revert STOP();
        }

        return walletBalances[_employee_address];
    }

    function get_employee(address _employeeAddress) external view returns (EmployeeData.Employee memory) {
        return Employees[_employeeAddress];
    }

    function get_all_employee() external view returns (EmployeeData.Employee[] memory) {
        return EmployeeList;
    }

    
    
}