// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import "./EmployeeManagementSystem.sol";

contract FactoryEmployeeManagementSystem{

    address [] allContracts;

    function createContract(address owner)external{
        owner = msg.sender;
        EmployeeManagementSystem new_Employee = new EmployeeManagementSystem(owner);
        allContracts.push(address(new_Employee));

    }

    function getContract()external view returns(address [] memory){
        return allContracts;
    }

}