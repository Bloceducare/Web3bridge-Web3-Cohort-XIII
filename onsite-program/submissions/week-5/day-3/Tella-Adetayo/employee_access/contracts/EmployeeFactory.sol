// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "./Employee.sol";
import "../library/Storage.sol";

contract EmployeeFactory {
    using Storage for Storage.Layout; 

    

    function createEmployee(address _owner) external {
        Storage.Layout storage ds = Storage.layout(); 
        Employee newEmployee = new Employee(_owner);
        ds.allAddr.push(address(newEmployee));
    }

    function getAllAddr() external view returns (address[] memory) {
        Storage.Layout storage ds = Storage.layout(); 
        return ds.allAddr;
    }
}