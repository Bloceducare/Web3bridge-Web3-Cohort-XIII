// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

interface IStaffMgt {
    function registerStaff(
        address _address,
        string memory _name,
        string memory _role,
        uint _salary
    ) external;

    function payStaff(uint _amount) external;

}
