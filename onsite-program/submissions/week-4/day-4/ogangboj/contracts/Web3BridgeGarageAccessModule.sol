// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Web3BridgeGarageAccess {
    
    enum Role {
        NONE,
        MEDIA_TEAM,
        MENTOR,
        MANAGER,
        SOCIAL_MEDIA_TEAM,
        TECHNICIAN_SUPERVISOR,
        KITCHEN_STAFF
    }

   
    struct Employee {
        string name;
        Role role;
        bool isActive;
    }

    
    mapping(address => Employee) public employees;

   
    address[] public employeeList;

    event EmployeeUpdated(address indexed employeeAddress, string name, Role role, bool isActive);

    
    function addOrUpdateEmployee(
        address _employeeAddress,
        string memory _name,
        Role _role,
        bool _isActive
    ) public {
        
        Employee storage employee = employees[_employeeAddress];
        
       
        if (bytes(employee.name).length == 0) {
            employeeList.push(_employeeAddress);
        }
        
        employee.name = _name;
        employee.role = _role;
        employee.isActive = _isActive;

        emit EmployeeUpdated(_employeeAddress, _name, _role, _isActive);
    }

    function canAccessGarage(address _employeeAddress) public view returns (bool) {
        Employee storage employee = employees[_employeeAddress];

      
        if (!employee.isActive || employee.role == Role.NONE) {
            return false;
        }

        return (
            employee.role == Role.MEDIA_TEAM ||
            employee.role == Role.MENTOR ||
            employee.role == Role.MANAGER
        );
    }

    function getAllEmployees() public view returns (address[] memory) {
        return employeeList;
    }

   
    function getEmployeeDetails(address _employeeAddress) 
        public 
        view 
        returns (
            string memory name,
            Role role,
            bool isActive
        ) 
    {
        Employee storage employee = employees[_employeeAddress];
        return (employee.name, employee.role, employee.isActive);
    }
}