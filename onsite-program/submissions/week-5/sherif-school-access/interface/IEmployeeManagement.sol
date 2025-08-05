// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IEmployee {
    struct Employee {
        string name;
        address user_address;
        uint256 salary;
        STATUS status;
        ROLE role;
    }

    enum ROLE {
        MENTORS,
        SECURITY,
        CLEANER
    }

    enum STATUS {
        EMPLOYED,
        PROBATION,
        TERMINATED
    }

    function create_employee(
        string memory _name,
        address _address,
        uint256 _salary,
        STATUS _status,
        ROLE _role
    ) external;

    function pay_employee(address _employer_address, uint256 _amount) external;

    function get_all_employees() external view returns (Employee[] memory);

    function get_emplooyee(
        address _addr
    ) external view returns (Employee memory);
}