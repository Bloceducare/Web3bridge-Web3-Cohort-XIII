// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;


contract Web3garageManagement {
    Employee [] public  employees;
    mapping (address => Employee) public  employeesMap;


    struct Employee{
        string name;
        Role role;
        bool isEmployed;
        address employeeAddress;
    }

    error EMPLOYEE_NOT_FOUND();
    error UNAUTHORIZED();

    enum Role {
    MEDIA_TEAM,
    MENTORS,
    MANAGERS,
    SOCIAL_MEDIA_TEAM,
    TECHNICIAN_SUPERVISORS,
    KITCHEN_STAFF 
    }

    function addEmployee(string memory _name, Role _role, address _address) external {
        require(employeesMap[_address].employeeAddress == address(0), "Already registered");

        Employee memory newEmployee;
        newEmployee.name = _name;
        newEmployee.role = _role;
        newEmployee.isEmployed = true;
        newEmployee.employeeAddress = _address;
        employees.push(newEmployee);
        employeesMap[_address] = newEmployee;
    }

    function updateEmployeeRole(Role  _role, address _address) external {
            require(employeesMap[_address].employeeAddress != address(0), "Employee not found");

        for (uint i; i < employees.length; i++) {
            if (employees[i].employeeAddress == _address){
                employees[i].role = _role;
                employeesMap[_address].role = _role;
                return; 
            }
        }  

        revert EMPLOYEE_NOT_FOUND();
    }

     function updateEmployeeName(string memory _name, address _address) external {
        require(employeesMap[_address].employeeAddress != address(0), "Employee not found");

        for (uint i; i < employees.length; i++) {
            if (employees[i].employeeAddress == msg.sender){
                employees[i].name = _name;
                employeesMap[msg.sender].name = _name;
                return; 
            }
        }  

        revert EMPLOYEE_NOT_FOUND();
    }

    function updateEmploymentStatus(address _employeeAddress) external {
        require(employeesMap[_employeeAddress].employeeAddress != address(0), "Employee not found");
        employeesMap[_employeeAddress].isEmployed = !employeesMap[_employeeAddress].isEmployed;
          for (uint i; i < employees.length; i++) {
            if (employees[i].employeeAddress == _employeeAddress){
                employees[i].isEmployed = !employees[i].isEmployed;
                return; 
            }
        }

    }

    function getAllEmployee() external view returns (Employee [] memory) {
        require(employees.length > 0, "No registered employee");
        return employees;
    }

     function getEmployee(address _employeeAddress) external view returns (Employee memory) {
        require(employeesMap[_employeeAddress].employeeAddress != address(0), "Employee not found");
        return employeesMap[_employeeAddress];
    }

    function canAccessGarage(address _address) external view returns(bool) {
        require(employeesMap[_address].employeeAddress == address(0) && !employeesMap[_address].isEmployed, UNAUTHORIZED());
        Role employeeRole = employeesMap[_address].role;
        if (employeeRole == Role.MEDIA_TEAM || employeeRole == Role.MENTORS || employeeRole == Role.MANAGERS) return true;
        return false;

    }


   
}