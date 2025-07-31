// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract AccessManagementSystem {
    struct Employee {
        string name;
        Role role;
        Access access;
        bool isEmployed;
    }

    enum Role {

        MEDIA_TEAM,
        MENTORS,
        MANAGERS,
        SOCIAL_MEDIA_TEAM,
        TECHNICIAN_SUPERVISOR,
        KITCHEN_STAFF
    }

    enum Access {

        GRANTED,
        DENIED
    }

    mapping (address => Employee) public employee;
    Employee[] public employees;
    error INVALID_ADDRESS();
    address public employee_address;

    function add_employee(address _employee_address, string memory _name) external {
        if (_employee_address == address(0)) revert INVALID_ADDRESS();
        employee[_employee_address] = Employee({name: _name, role: Role.MEDIA_TEAM, access: Access.GRANTED, isEmployed: true});
        employees.push(employee[_employee_address]);
    }

    function update_employee_access(address _employee_address, Access _access) external {

        employee[_employee_address].access = _access;
    }


    function get_all_employees() external view returns (Employee[] memory) {
        return employees;
    }


//    function accessGarage(address employee_address)external view returns (bool){
//        for(uint i; i < employees.length; i++){
//            if(employees[i].employee_address == employee_address){
//                return employees[i].isEmployed &&
//                    (employees[i].role == Role.MEDIA_TEAM, employees[i].role == Role.MENTORS, employees[i].role == Role.MANAGERS);
//            }
//        }
//        return false;
//    }
//    function getAllEmployees()external view returns(Employee[] memory){
//        return employees;
//    }



}