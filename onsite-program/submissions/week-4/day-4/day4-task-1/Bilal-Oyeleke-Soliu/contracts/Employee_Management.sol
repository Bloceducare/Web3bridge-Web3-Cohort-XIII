// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

contract Web3BridgeGarage {
    address public owner;

    enum Role {
        MediaTeam,
        Mentors,
        Managers,
        SocialMediaTeam,
        TechnicianSupervisors,
        KitchenStaff
    }

    struct Employee {
        string name;
        Role role;
        bool employed;
    }

    error USER_DONT_HAVE_ACCESS();
    error ONLY_OWNER();
    error EMPLOYEE_ALREADY_EXISTS();
    error EMPLOYEE_NOT_FOUND();

    mapping(address => Employee) private employeesData;
    address[] private employeeAddresses;

    modifier onlyOwner() {
        if (msg.sender != owner) revert ONLY_OWNER();
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function addEmployee(address _employeeAddress, string memory _name, Role _role) external onlyOwner {
        if (bytes(employeesData[_employeeAddress].name).length != 0) {
            revert EMPLOYEE_ALREADY_EXISTS();
        }
        employeesData[_employeeAddress] = Employee(_name, _role, true);
        employeeAddresses.push(_employeeAddress);
    }

    function updateEmployee(address _employeeAddress, string memory _newName, Role _newRole, bool _employed) external onlyOwner {
        if (bytes(employeesData[_employeeAddress].name).length == 0) {
            revert EMPLOYEE_NOT_FOUND();
        }
        employeesData[_employeeAddress] = Employee(_newName, _newRole, _employed);
    }

    function terminateEmployee(address _employeeAddress) external onlyOwner {
        if (bytes(employeesData[_employeeAddress].name).length == 0) {
            revert EMPLOYEE_NOT_FOUND();
        }
        employeesData[_employeeAddress].employed = false;
    }

    function garageAccessControl(address _employeeAddress) external view {
        Employee memory emp = employeesData[_employeeAddress];
        if (
            !emp.employed ||
            (emp.role != Role.MediaTeam &&
             emp.role != Role.Mentors &&
             emp.role != Role.Managers)
        ) {
            revert USER_DONT_HAVE_ACCESS();
        } return;
    }

    function getEmployeesList() external view returns (Employee[] memory) {
        Employee[] memory allEmployees = new Employee[](employeeAddresses.length);
        for (uint i = 0; i < employeeAddresses.length; i++) {
            allEmployees[i] = employeesData[employeeAddresses[i]];
        }
        return allEmployees;
    }

    function getAnEmployee(address _employeeAddress) external view returns (Employee memory) {
        return employeesData[_employeeAddress];
    }
}
