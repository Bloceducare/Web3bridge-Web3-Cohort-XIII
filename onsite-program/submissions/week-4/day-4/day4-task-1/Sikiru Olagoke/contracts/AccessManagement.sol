// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

contract AccessManagement {
    enum ROLE {
        MEDIA_TEAM,
        MENTORS,
        MANAGER,
        SOCIAL_MEDIA_TEAM,
        TECHNICAL_SUPERVISOR,
        KITCHEN_STAFF
    }

    struct Employee {
        string name;
        ROLE role;
        bool access;
        address user_address;
    }

    // mapping(ROLE => bool) role_access;

    mapping(address => Employee) employee;

    Employee[] employees;

    function add_employee(
        string memory _name,
        ROLE _role,
        bool _access
    ) external {
        address _address = msg.sender;
        Employee memory data = Employee(_name, _role, _access, _address);
        employee[_address] = data;
        employees.push(data);
    }

    function get_employee_by_address(
        address _address
    ) external view returns (Employee memory) {
        return employee[_address];
    }

    function get_employee_array() external view returns (Employee[] memory) {
        return employees;
    }

    function access_garage(address _address) external view {
        require(
            employee[_address].access,
            "Employee can not access the garage"
        );
        require(
            employee[_address].role == ROLE.MEDIA_TEAM ||
                employee[_address].role == ROLE.MENTORS ||
                employee[_address].role == ROLE.MANAGER,
            "Employee can not access the garage"
        );
    }

    function update_employee(
        address _address,
        string memory _name,
        ROLE _role,
        bool _access
    ) external {
        require(_address != address(0), "Employee can not be found");
        employee[_address].name = _name;
        employee[_address].role = _role;
        employee[_address].access = _access;

        for (uint i; i < employees.length; i++) {
            if (employees[i].user_address == _address) {
                employees[i].name = _name;
                employees[i].role = _role;
                employees[i].access = _access;

                return;
            }
        }
        revert("USER_CAN'T_BE_FOUND");
    }
}
