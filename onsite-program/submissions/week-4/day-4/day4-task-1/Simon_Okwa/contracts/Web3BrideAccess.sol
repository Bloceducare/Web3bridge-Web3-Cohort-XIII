// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

contract Web3BridgeAccess {

 enum EmployeeRole { 
        MEDIA_TEAM,             // Can access garage
        MENTORS,                // Can access garage  
        MANAGERS,               // Can access garage
        SOCIAL_MEDIA_TEAM,      // No garage access
        TECHNICIAN_SUPERVISORS, // No garage access
        KITCHEN_STAFF          // No garage access
    }
    
 
    struct Employee {
        string name;
        EmployeeRole role;
        bool isEmployed;
    }
    

    mapping(address => Employee) public employees;
    

    Employee[] public all_employees;
    
    
    function addEmployee( address _employeeAddress, string memory _name, EmployeeRole  _role, bool _isEmployed) external {
    
        employees[_employeeAddress] = Employee(_name, _role, _isEmployed);
        
        all_employees.push(Employee(_name, _role, _isEmployed));
    }
    

    function updateEmployee(address _employeeAddress, string memory _name, EmployeeRole _role,  bool _isEmployed) external {
    
        employees[_employeeAddress] = Employee(_name, _role, _isEmployed);
        
        all_employees.push(Employee(_name, _role, _isEmployed));
    }
    
    function canAccessGarage(address _employeeAddress) external view returns (bool) {
        Employee memory employee = employees[_employeeAddress];
        
        if (!employee.isEmployed) {
            return false;
        }
        
        if (employee.role == EmployeeRole.MEDIA_TEAM || 
             employee.role == EmployeeRole.MENTORS || 
             employee.role == EmployeeRole.MANAGERS) {
            return true;
        }
        
        return false;
    }
    
    function getAllEmployees() external view returns (Employee[] memory) {
        return all_employees;
    }
    
    function getEmployeeDetails(address _employeeAddress) external view returns (Employee memory) {
        return employees[_employeeAddress];
    }
}