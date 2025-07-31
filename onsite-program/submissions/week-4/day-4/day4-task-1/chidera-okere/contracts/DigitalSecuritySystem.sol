// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract digital_security_system {

   enum Role {
        MEDIA_TEAM,
        MANAGERS,
        MENTORS,
        SOCIAL_MEDIA_TEAM,
        TECHNICIAN_SUPERVISORS,
        KITCHEN_STAFF
   }
   
   enum Status {
     EMPLOYED,
     TERMINATED
   }

   struct EmployeeData {
    string name;
    Role role;
    Status status;
   }

   EmployeeData[] public employees;
   mapping(address => EmployeeData) public employees_map;

   function addEmployee(address _employeeAddress, string memory _name, Role _role) external {
      EmployeeData memory new_employee = EmployeeData(_name, _role, Status.EMPLOYED);
      
      if (bytes(employees_map[_employeeAddress].name).length == 0) {
          employees.push(new_employee);
      }
      
      employees_map[_employeeAddress] = new_employee;
   }

   function updateEmployeeStatus(address _employeeAddress, Status _status) external {
       require(bytes(employees_map[_employeeAddress].name).length > 0, "Employee does not exist");
       employees_map[_employeeAddress].status = _status;
       
       for (uint i = 0; i < employees.length; i++) {
           if (keccak256(bytes(employees[i].name)) == keccak256(bytes(employees_map[_employeeAddress].name))) {
               employees[i].status = _status;
               break;
           }
       }
   }

   function checkAccess(address _employeeAddress) external view returns(bool) {
       EmployeeData memory employee = employees_map[_employeeAddress];
       
       if (bytes(employee.name).length == 0) {
           return false;
       }
       
       if (employee.status == Status.TERMINATED) {
           return false;
       }
       
       if (employee.role == Role.MEDIA_TEAM || 
           employee.role == Role.MANAGERS || 
           employee.role == Role.MENTORS) {
           return true;
       }
       
       return false;
   }

   function getAllEmployees() external view returns(EmployeeData[] memory) {
       return employees;
   }

   function getEmployeeDetails(address _employeeAddress) external view returns(string memory name, Role role, Status status) {
       EmployeeData memory employee = employees_map[_employeeAddress];
       require(bytes(employee.name).length > 0, "Employee does not exist");
       
       return (employee.name, employee.role, employee.status);
   }

   function getTotalEmployees() external view returns(uint) {
       return employees.length;
   }
}