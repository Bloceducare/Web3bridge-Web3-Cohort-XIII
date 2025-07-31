// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;


contract Web3BridgeGarage{

    enum ROLE {
        MEDIA_TEAM,
        MENTORS,
        MANAGERS,
        SOCIAL_MEDIA_TEAM,
        TECHNICAL_SUPERVISORS,
        KITCHEN_STAFF
}

  struct EMPLOYEE{
    string  name;
    ROLE role;
    bool isEmployed;
    address employeeAddress;
  }

  mapping(address => EMPLOYEE) employees;
  EMPLOYEE [] employeeList;


  function addEmployee(string memory _name,ROLE _role)external {
     EMPLOYEE memory newEmployee;
     newEmployee.name = _name;
     newEmployee.employeeAddress = msg.sender;
     newEmployee.role = _role;
     newEmployee.isEmployed = true;
     employees[msg.sender] = newEmployee;
     employeeList.push(newEmployee);
  }

  function updateEmployee(string memory _new_name) external{
    for(uint256 i; i < employeeList.length;i++){
        if(employeeList[i].employeeAddress == msg.sender){
            employeeList[i].name = _new_name;
            employees[msg.sender].name = _new_name;
            return ;
        }
    }
       revert("Employee not found");

  }

  function getEmployeeById(address _employeeAddress)external view returns(EMPLOYEE  memory){
         return employees[_employeeAddress];
  }


  function getAllEmployeeList() external view returns(EMPLOYEE [] memory){
    return employeeList;
  }

  function checkEmployeeAccess(address _employeeAddress) external view returns (bool){
    EMPLOYEE memory employee = employees[_employeeAddress];
    if(employee.isEmployed || employee.role == ROLE.MEDIA_TEAM || employee.role == ROLE.MENTORS || employee.role == ROLE.MANAGERS){
        return true;
        
    }
    return false;

  }


  
}