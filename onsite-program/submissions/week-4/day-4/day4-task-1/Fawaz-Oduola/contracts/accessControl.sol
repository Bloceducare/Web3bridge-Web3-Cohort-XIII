// SPDX-License-Identifier: MIT
pragma solidity  >=0.8.25;

contract AccessControl{

    struct Employee{
        address addr;
        string name;
        Role role;
        bool active;
    }

    error EMPLOYEE_NOT_FOUND();

    enum Role{MEDIA, MENTOR, MANAGER, SOCIAL, TECHNICIAN, KITCHEN}
    
    mapping(address => Employee) addressToEmployee;
    Employee[] public employees;

    //Role with access
    mapping(Role => bool) public roleAccess;

    constructor(){
        roleAccess[Role.MEDIA] = true;
        roleAccess[Role.MENTOR] = true;
        roleAccess[Role.MANAGER] = true;
    }
    



    function addEmployee(address _addr, string memory _name, Role _role) external {
        Employee memory newEmployee = Employee(_addr, _name, _role, true);
        addressToEmployee[_addr] = newEmployee;
        employees.push(newEmployee);
    }

    function updateEmployee(address _addr, string memory _name, Role _role, bool _active) external {
        Employee memory employee = addressToEmployee[_addr];
        employee.name = _name;
        employee.role = _role;
        employee.active = _active;
        addressToEmployee[_addr] = employee;

        for (uint i; i<employees.length; i++){
            if (employees[i].addr == _addr){
                employees[i].name = _name;
                employees[i].role = _role;
                employees[i].active = _active;
                return;
            }
        }

        revert ("EMPLOYEE_NOT_FOUND");
    }

    function checkAccess(address _addr) external view returns (bool) {
        Employee memory employee = addressToEmployee[_addr];
        Role _role = employee.role;

        return roleAccess[_role] && employee.active;
    }

    function getAllEmployees() external view returns(Employee[] memory){
        return employees;
    }

    function getEmployee(address _addr) external view returns(Employee memory){
        return addressToEmployee[_addr];
    }



}