// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IEmployeePayroll} from "../Interfaces/IEmployeePayroll.sol";

contract EmployeePayroll is IEmployeePayroll{

    error INVALID_ADDRESS();
    error UNAUTHORISED();

    address public owner;


   mapping (address => Employee) public employeeByAddress;

   Employee[] public employees;

   receive() external payable;
   fallback() external payable;


    function addEmployee(address _employeeAddress, string memory _name, uint _salary, Status _status, Role _role) external {

        if (_employeeAddress == address(0)) revert INVALID_ADDRESS();
        
        Employee memory newEmployee = Employee(_employeeAddress, _name, _salary, Status.EMPLOYED, Role.ADMIN);
        employeeByAddress[_employeeAddress] = newEmployee; 

        employees.push(newEmployee);

    }


    function getAllEmployees() external view returns(Employee[] memory) {
        return employees;
    }

    function updateEmployee(address _employeeAddress, string memory _name, uint _age, uint _salary, Status _status) external {
        if (msg.sender == address(0)) revert INVALID_ADDRESS();
        if (employeeByAddress[msg.sender].address != msg.sender) revert UNAUTHORISED();

        for (uint i; employees.length; i++) {
            employeeByAddress[_employeeAddress].name = _name;
            employeeByAddress[_employeeAddress].age = _age;
            employeeByAddress[_employeeAddress].salary = _salary;
            employeeByAddress[_employeeAddress].status = _status;

            for (uint i = 0; i < employees.length; i++) {
                if (employees[i].account = _employeeAddress) {
                    
                    employees[i].account = _employeeAddress;
                    employees[i].name = _name;
                    employees[i].age = _age;
                    employees[i].salary = _salary;
                    employees[i].status = _status;

                    break;

                }
                
            }
            
        }

    }

    function payEmployee(address payable _to, uint _amount) external {
        

    }
   
}