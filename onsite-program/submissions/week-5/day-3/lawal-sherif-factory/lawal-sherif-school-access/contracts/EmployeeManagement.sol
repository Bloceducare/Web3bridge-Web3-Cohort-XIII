// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../interface/IEmployeeManagement.sol";
import "../library/Error.sol";

contract EmployeeManagement is IEmployee {
    address public owner;
    Employee[] employees;

    mapping(address => Employee) employee;

    constructor(address _owner) {
        owner = _owner;
    }

    function create_employee(
        string memory _name,
        address _employeeAddress,
        uint256 _salary,
        STATUS _status,
        ROLE _role
    ) external {
        Employee memory _new_employee_ = Employee(
            _name,
            _employeeAddress,
            _salary,
            _status,
            _role
        );
        
        employees.push(_new_employee_);
        employee[_employeeAddress] = _new_employee_;
    }

    function pay_employee(address _employer_address, uint256 _amount) external {
        require(owner == msg.sender, "Must be onwer");
        
        if (
            employee[_employer_address].salary == _amount &&
            employee[_employer_address].status != STATUS.TERMINATED
        ) {
            payable(_employer_address).transfer(_amount);
        } else {
            revert Error.SALARY_DO_NOT_MATCH();
        }
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