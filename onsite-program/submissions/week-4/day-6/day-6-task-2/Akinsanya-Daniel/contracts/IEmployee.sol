// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
interface IEmployee {
    
    struct Employee {
    uint256 employeeId;
    string  name;
    uint256 age;
    ROLE role;
    address employeeAddress;
    STATUS status;
    uint256 salary;
    }


    enum ROLE {
    MEDIA_TEAM,
    MENTORS,
    ADMIN     
}

   enum STATUS {
    NON_EMPLOYED, 
    EMPLOYED,
    PROBABTION
   }


   function registerEmployee(address _employeeAddress,string memory _name,uint256 _age, uint256 _salary,ROLE _role) external ;

   function payEmployeeSalary(address payable _to,uint256 _amount) external payable ;


   function getEmployee(address _employeeAddress) external view returns(Employee memory);
}