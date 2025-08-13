// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract EmployeeAccess {
    event GrantAccess(string message); 
    event RevokeAccess(string message);

    enum Status {
        ACCEPTED, 
        REJECTED 
    }

    enum Roles {
        MEDIA_TEAM,
        MENTORS, 
        MANAGERS, 
        SOCIAL_MEDIA_TEAM, 
        TECHNICIAN_SUPERVISORS, 
        KITCHEN_STAFF
    }

    struct Employee {
        string name; 
        Roles role; 
        bool isEmployed; 
    }

    Employee[] internal allEmployees; 

    mapping(address => Employee[]) internal employees; 

    function addEmployee(address _account, string memory _name, Roles _role, bool _isEmployeed) external {
        Employee memory emp = Employee(_name, _role, _isEmployeed); 
        allEmployees.push(emp);
        employees[_account].push(emp); 
    }

    function updateEmployee(uint256 _index, address _account, string memory _name, Roles _role, bool _isEmployed) external {
        Employee[] storage emp = employees[_account]; 
        emp[_index].name = _name; 
        emp[_index].role = _role; 
        emp[_index].isEmployed = _isEmployed;

    }

    function terminateEmployee(address _account, uint256 _index) external {
    require(_index < employees[_account].length, "Invalid index");

    employees[_account][_index].isEmployed = false;

    emit RevokeAccess("Employee terminated and access revoked.");
}


    function canAccessGarage(address _account) external returns (string memory) {
    Employee[] memory emp = employees[_account];

    for (uint256 i = 0; i < emp.length; i++) {
        if (
            emp[i].isEmployed &&
            (emp[i].role == Roles.MENTORS || emp[i].role == Roles.MEDIA_TEAM || emp[i].role == Roles.MANAGERS)
        ) {
            emit GrantAccess("Access accepted.");
            return "Access accepted";
        }
    }

    emit RevokeAccess("Access denied.");
    return "Access denied";
}

        

    function getAllEmployees() external view returns (Employee[] memory) {
        return allEmployees; 

    }
    function getEmployee(address _account) external view returns (Employee[] memory) {
        return employees[_account];
    } 


}