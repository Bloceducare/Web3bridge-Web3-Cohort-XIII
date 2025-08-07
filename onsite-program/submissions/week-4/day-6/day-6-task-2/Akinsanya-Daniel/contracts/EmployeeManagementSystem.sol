// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import "./IEmployee.sol";

contract EmployeeManagementSystem is IEmployee{
    mapping(address => Employee) employees;
    uint256 uuid;
    address owner;

    constructor(address _owner){
        owner = _owner;
    }

    function registerEmployee(address _address,string memory _name,uint256 _age, uint256 _salary, ROLE _role) external{
        if(employees[_address].status == STATUS.EMPLOYED){
            revert("Employee is already Employed");
        }
        uuid = uuid + 1;
        Employee memory newEmployee;
        newEmployee.employeeId = uuid;
        newEmployee.name = _name;
        newEmployee.age = _age;
        newEmployee.salary = _salary;
        newEmployee.role = _role;
        newEmployee.status = STATUS.EMPLOYED;
        employees[_address] = newEmployee;
         }

       function payEmployeeSalary(address payable _to,uint256 _amount) external payable {
          if(employees[msg.sender].role != ROLE.ADMIN){
             revert("You are not an Admin");
          }
          if(employees[_to].status != STATUS.EMPLOYED || employees[_to].salary != _amount){
             revert("Employee is not Employed");
          }
          payable(_to).transfer(_amount);
       }

        function getEmployee(address _employeeAddress) external view returns(Employee memory){
            return employees[_employeeAddress];
        }


        receive() external payable {}

   
        fallback() external payable {}

       
    

    
  }
  


