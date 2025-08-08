// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./EmployeePayroll.sol";

contract Factory {

    EmployeePayroll[] public allPayments;

    function createEmployeePayroll(adress _employeeAddress, string memory _name, uint salary, Status _status, Role _role) external {
        EmployeePayroll employeePayroll = new EmployeePayroll(_employeeAddress, _name, _salary, _status, _role);
        allPayments.push(employeePayroll);
    }

    function getAllEmployeePayrol() external view returns(EmployeePayroll[] memory) {
        return allPayments;
    }


    

}