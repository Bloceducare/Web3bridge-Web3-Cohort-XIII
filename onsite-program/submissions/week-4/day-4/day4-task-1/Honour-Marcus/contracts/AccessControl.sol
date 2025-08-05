// SPDX-License-Identifier: MIT

pragma solidity ^0.8.25;

contract AccessControl {
    enum Roles {
        MediaTeam,
        Mentors,
        Managers,
        SocialMediaTeam,
        TechnicianSupervisor,
        KitchenStaff
    }

    struct Employee {
        string Name;
        Roles role;
        bool Employed;
    }

    mapping(address => Employee) addrtoemp;
    address[] public employeeList;

    function addEmployee(
        address _empAddress,
        string memory _name,
        Roles _role,
        bool _employed
    ) public {
        require(bytes(addrtoemp[_empAddress].Name).length == 0, "Employee already exists");

        addrtoemp[_empAddress] = Employee({
            Name: _name,
            role: _role,
            Employed: _employed
        });

        employeeList.push(_empAddress);
    }

    function updateEmployee(
        address _empAddress,
        string memory _name,
        Roles _role,
        bool _employed
    ) public {
        require(bytes(addrtoemp[_empAddress].Name).length != 0, "Employee does not exist");

        addrtoemp[_empAddress] = Employee({
            Name: _name,
            role: _role,
            Employed: _employed
        });
    }

    function canAccessGarage(address _empAddress) public view returns (bool) {
        Employee memory emp = addrtoemp[_empAddress];

        if (!emp.Employed) {
            return false;
        }

        if (
            emp.role == Roles.MediaTeam ||
            emp.role == Roles.Mentors ||
            emp.role == Roles.Managers
        ) {
            return true;
        }

        return false;
    }

    function deleteEmployee(address _empAddress) public {
    require(bytes(addrtoemp[_empAddress].Name).length != 0, "Employee does not exist");
        delete addrtoemp[_empAddress];
        for (uint256 i = 0; i < employeeList.length; i++) {
            if (employeeList[i] == _empAddress) {
            employeeList[i] = employeeList[employeeList.length - 1]; // Move last to deleted index
            employeeList.pop(); // Remove last element
            break;}
        }
    }

    function getAllEmployees() public view returns (address[] memory) {
        return employeeList;
    }

    function getEmployee(address _empAddress) public view returns (
        string memory name,
        Roles role,
        bool employed
    ) {
        Employee memory emp = addrtoemp[_empAddress];
        return (emp.Name, emp.role, emp.Employed);
    }
}
