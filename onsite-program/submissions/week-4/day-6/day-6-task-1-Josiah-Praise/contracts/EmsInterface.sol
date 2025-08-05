// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

interface IEMS {
    enum Status {
        EMPLOYED,
        UNEMPLOYED,
        PROBATION
    }

    enum Role {
        MENTOR,
        JANITOR,
        SECURITY,
        MANAGER
    }

    struct Employee{
        address payable employee_address;
        uint256 salary;
        string name;
        string telephone;
        string house_address;
        Status status;
        Role role;
        bool exists;
    }

    function registerEmployee(
        address payable _employee_address,
        string calldata _salary,
        string  calldata _name,
        string  calldata _telephone,
        string calldata _house_address,
        Role _role
        ) external ;


    function payEmployee(address payable _id)external;

    function getEmployee(address payable _id) external view returns(Employee memory);

    function fireEmployee(address _address)external;

    function changeDetails(address payable _address, string calldata _name, string calldata _telephone, string calldata _house_address)external;
}