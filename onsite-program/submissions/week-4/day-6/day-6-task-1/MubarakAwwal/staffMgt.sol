// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import "./ISchool.sol";

error TransferConditionsNotMet();

contract staffMgt is IStaffMgt {
    enum StaffStatus { Employed, Probation, Unemployed }

    struct StaffData {
        string role;
        string name;
        uint salary;
        StaffStatus status;
    }

    mapping(address => StaffData) staffs;
    mapping(address => bool) isEmployed;
    address[] public ListOfStaffs;

    function registerStaff(
        address _address,
        string memory _name,
        string memory _role,
        uint _salary
    ) external override {
        StaffData memory newStaff = StaffData(_name, _role, _salary, StaffStatus.Employed);
        staffs[_address] = newStaff;

        if (!isEmployed[_address] && newStaff.status == StaffStatus.Employed) {
            isEmployed[_address] = true;
            ListOfStaffs.push(_address);
        }
    }

    receive() external payable {}

    function payStaff(uint _amount) external override {
        StaffData memory staff = staffs[msg.sender];

        if (staff.status == StaffStatus.Employed && staff.salary == _amount) {
            payable(msg.sender).transfer(staff.salary);
            return;
        }

        revert TransferConditionsNotMet();
    }

 
}
