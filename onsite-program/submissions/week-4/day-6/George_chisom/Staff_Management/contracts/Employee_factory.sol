// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.28;

import "./Employee_management.sol";


contract EmployeeFactory {
    
    // EmployeeManagement[] public EmployeeFactory;

    address [] public FactoryAddress;


    address owner;


    constructor() {
        owner = msg.sender;
    }


    function register_factory_employee () external {

        EmployeeManagement _newEmployee = new EmployeeManagement();

        // _newEmployee.transferOwnership(msg.sender);


        address new_address = address(_newEmployee);

        // EmployeeFactory.push(_newEmployee);

        FactoryAddress.push(new_address);

    }


    function get_an_employee () external view returns (address) {
        return FactoryAddress[0];
    }

    function factory_length_employee () external view returns (uint256) {
        return FactoryAddress.length;
    }

    function get_all_employee() external view returns (address[] memory) {
        return FactoryAddress;
    }

    

}