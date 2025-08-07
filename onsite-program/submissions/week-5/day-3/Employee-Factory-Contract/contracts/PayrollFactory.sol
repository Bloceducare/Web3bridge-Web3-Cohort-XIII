// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import "./Payroll.sol";

contract PayrollFactory {
    address[] public allPayrolls;
    mapping(address => address[]) public createdBy; // creator → list of their payroll contracts

    event PayrollCreated(address indexed owner, address payrollAddress);

    function createPayroll() external returns (address) {
        payroll newPayroll = new payroll();
        address payrollAddress = address(newPayroll);
        allPayrolls.push(payrollAddress);
        createdBy[msg.sender].push(payrollAddress);

        emit PayrollCreated(msg.sender, payrollAddress);
        return payrollAddress;
    }

    function getAllPayrolls() external view returns (address[] memory) {
        return allPayrolls;
    }

    function getMyPayrolls() external view returns (address[] memory) {
        return createdBy[msg.sender];
    }
}
