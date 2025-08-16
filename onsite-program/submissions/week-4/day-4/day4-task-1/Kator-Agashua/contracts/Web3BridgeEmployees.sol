// A smart contract for a digital keycard access at Web3Bridge

// SPDX-License-Identifier: MIT

pragma solidity ^0.8.28;

error EmployeeAlreadyExists();

contract Web3BridgeEmployees {
    enum Role {
        MENTOR,
        MANAGER,
        MEDIA_TEAM,
        SOCIAL_MEDIA_TEAM,
        TECHNICAL_SUPERVISOR,
        KITCHEN_STAFF
    }

    struct Employee {
        string name;
        Role role;
        uint256 employeeId;
        bool isActive;
        bool hasAccess;
    }

    mapping(address => Employee) public employee;

    Employee[] public employees;

    uint256 nonce;

    function addEmployee(address _address,string memory _name, Role _role) external {
        if(employee[_address].employeeId != 0) revert EmployeeAlreadyExists();
        nonce++;
        uint256 _employeeId = uint256(
            keccak256(abi.encodePacked(_name, _role, nonce))
        );
        bool _hasAccess = true;

        if(_role == Role.SOCIAL_MEDIA_TEAM ||
        _role == Role.TECHNICAL_SUPERVISOR ||
        _role == Role.KITCHEN_STAFF) {
            _hasAccess = false;
        }


        employee[_address] = Employee(_name, _role, _employeeId, true, _hasAccess);
        employees.push(Employee(_name, _role, _employeeId, true, _hasAccess));
    }

    function getEmployee(address _address) external view returns (Employee memory) {
        return employee[_address];
    }


    function updateEmployee(
        address _address,
        Role _role,
        bool _isActive,
        bool _hasAccess
    ) external {
        employee[_address].role = _role;
        employee[_address].isActive = _isActive;
        employee[_address].hasAccess = _hasAccess;
    }

    function getAllEmployees() external view returns(Employee[] memory){
        return employees;
    }


    function grantAccess ( address _address) external view returns (string memory){
        if(employee[_address].hasAccess == true && employee[_address].isActive == true) {
            return "Access Granted";
        } 
        return "Access Denied";
    }


}
