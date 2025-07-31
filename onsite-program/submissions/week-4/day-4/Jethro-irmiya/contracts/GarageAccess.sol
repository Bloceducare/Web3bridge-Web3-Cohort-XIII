// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract GarageAccess {
  
    enum Role {
        MediaTeam,
        Mentor,
        Manager,
        SocialMediaTeam,
        TechnicianSupervisor,
        KitchenStaff
    }


    struct Employee {
        string name;
        Role role;
        bool isEmployed;
    }


    mapping(address => Employee) public employees;

  
    address[] public employeeList;

   
    function addOrUpdateEmployee(address _employeeAddress, string memory _name, Role _role, bool _isEmployed) public {
 
        bool exists = false;
        for (uint256 i = 0; i < employeeList.length; i++) {
            if (employeeList[i] == _employeeAddress) {
                exists = true;
                break;
            }
        }

    
        if (!exists) {
            employeeList.push(_employeeAddress);
        }

        employees[_employeeAddress] = Employee(_name, _role, _isEmployed);
    }

   
    function canAccessGarage(address _employeeAddress) public view returns (bool) {
        Employee memory employee = employees[_employeeAddress];
        
     
        if (!employee.isEmployed) {
            return false;
        }

       
        return (employee.role == Role.MediaTeam ||
                employee.role == Role.Mentor ||
                employee.role == Role.Manager);
    }


    function getAllEmployees() public view returns (address[] memory) {
        return employeeList;
    }

    function getEmployeeDetails(address _employeeAddress) public view returns (string memory name, Role role, bool isEmployed) {
        Employee memory employee = employees[_employeeAddress];
        return (employee.name, employee.role, employee.isEmployed);
    }
}