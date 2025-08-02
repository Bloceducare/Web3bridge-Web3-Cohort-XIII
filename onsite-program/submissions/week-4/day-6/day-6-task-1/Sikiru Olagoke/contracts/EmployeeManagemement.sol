// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../interface/IEmployeeManagement.sol";
import "../library/Error.sol";

contract EmployeeManagementSystem {
    address owner;
    Employee[] employees;

    mapping(address => IEmployee) employee;

    constructor() {
        owner = msg.sender;
    }

    function create_employee(
        string memory _name,
        address _address,
        uint256 _salary,
        STATUS _status,
        ROLE _role
    ) external view returns (Employee[] memory) {
        Employee memory _new_employee_ = Employee(
            _name,
            _address,
            _salary,
            _status,
            _role
        );
        employees.push(_new_employee_);
        employee[_address] = _new_employee_;
    }

    function pay_employee(
        address payable _employer_address,
        uint256 _amount
    ) external {
        require(owner == msg.sender, Error.YOU_CANT_PAY_YOURSELF());
        if (
            employee[_employer_address].salary == _amount &&
            employee[_employer_address].role != ROLE.TERMINATED
        ) {
            _employer_address.tranfer(_amount);
        }

        revert Error.SALARY_DO_NOT_MATCH();
    }

    function get_all_employees() external view returns (Employee[] memory) {
        return employees;
    }

    function get_emplooyee(
        address _addr
    ) external view returns (Employee memory) {
        return employee[_addr];
    }

    receive() external payable {}

    fallback() external payable {}
}
