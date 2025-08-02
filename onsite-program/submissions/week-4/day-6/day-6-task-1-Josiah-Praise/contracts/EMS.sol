// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "EmsInterface.sol";


//  struct Employee{
//         address employee_address;
//         uint256 salary;
//         string name;
//         string telephone;
//         string house_address;
//         Status status;
//         Role role;
//         bool exists;
//     }

contract EMS {

    mapping(address => IEMS.Employee) public employees;
    address payable public manager;


    constructor() {
        manager = payable (msg.sender);
    }

    error EMS__OnlyManager();

    modifier onlyManager {
        if (msg.sender != manager) {
            revert EMS__OnlyManager();
        }
        _;
    }

    function registerEmployee(
        address payable _employee_address,
        uint256 _salary,
        string  calldata _name,
        string  calldata _telephone,
        string calldata _house_address,
        IEMS.Role _role
    ) external onlyManager {
        IEMS.Employee memory newEmployee = IEMS.Employee(
            _employee_address, 
            _salary, 
            _name,
            _telephone, 
            _house_address, 
            IEMS.Status.EMPLOYED, 
            _role, 
            true
        ); 
        employees[_employee_address] = newEmployee;
    }

    function payEmployee(address payable _address)external onlyManager {
        if (
            employees[_address].exists &&
            employees[_address].status == IEMS.Status.EMPLOYED
        ) {
            _address.transfer(employees[_address].salary);
        }
    }

    function getEmployee(address payable _address)external view returns(IEMS.Employee memory){
        return employees[_address];
    }

    function fireEmployee(address _address)external onlyManager {
        if (employees[payable(_address)].exists && employees[payable(_address)].status == IEMS.Status.EMPLOYED) {
            IEMS.Employee storage firedEmployee = employees[payable(_address)];
            firedEmployee.status = IEMS.Status.UNEMPLOYED;
        }
    }

    function changeDetails(address payable _address, string calldata _name, string calldata _telephone, string calldata _house_address)external onlyManager {
        if (employees[_address].exists &&
            employees[_address].status != IEMS.Status.UNEMPLOYED
        ) {
            IEMS.Employee storage updatedEmployee = employees[_address];
            updatedEmployee.name = _name;
            updatedEmployee.telephone = _telephone;
            updatedEmployee.house_address = _house_address;
        }
    }
}