// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "./Employee.sol";

contract SchoolManagementStaffFactory {
    address[] public staffContracts;

    function createStaffContract() external returns (address) {
        SchoolManagementStaff staffContract = new SchoolManagementStaff();
        staffContracts.push(address(staffContract));
        return address(staffContract);
    }

    function getAllStaffContracts() external view returns (address[] memory) {
        return staffContracts;
    }
}
