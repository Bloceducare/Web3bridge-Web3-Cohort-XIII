//SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

interface ITMS {
    
    enum EmployeeRole {
        Admin,
        Mentor,
        Security
    }

    enum Status {
        Employed,
        Unemployed,
        Probation
    }

    struct Staff {
        address account;
        string name;
        uint256 amount;
        Status status;
        EmployeeRole role;
        bool paid;
    }
    // owner() external view returns (address);

    function register_staff(address _account, string memory _name, uint _amount, Status _status, EmployeeRole _role) external ;

    function pay_staff(address payable _account) external payable;

    function get_all_staff() external view returns(Staff[] memory);

    function update_staff_salary(address _account, uint256 new_amount) external;

    function delete_staff(address _account) external;

}