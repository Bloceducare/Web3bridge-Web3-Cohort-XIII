//SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.29;

contract Garage {
    enum Role {MANAGER, MENTOR, MEDIA, SOCIAL_MEDIA, SUPERVISORS, COOK}

    struct Employee {
        address employee;
        string name;
        Role role;
        bool isEmployeed;
    }

    Employee[] public employees;

    mapping(string => address) public nameToAddress;    

    function AddEmployee(string memory _name, Role _role, address _address) external {
        Employee memory new_employee_ = Employee(_address, _name, _role, true);

        employees.push(new_employee_);
    }

        function UpdateEmployee(address _address, string memory _name, Role _role) external {
        for (uint256 i = 0; i < employees.length; i++) {
            if (employees[i].employee == _address) { 
                employees[i].name = _name;           
                employees[i].role = _role;           
                return; 
            }  
        }
        revert("Employee not found"); 
    }


    function getEmployees() external view returns (Employee[] memory) {
        return employees;
    }


    function setAddress(string memory _name, address _address) public {
      nameToAddress[_name] = _address;
    }

    function getAddress(string memory _name) public view returns (address) {
        return nameToAddress[_name];
    }

}