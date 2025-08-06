// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

interface IEmployeeManagementSystem {
    struct Employee {
        uint256 id;
        string name;
        string role;
        address payable walletAddress;
        uint256 salary;
        EmploymentStatus employmentStatus;
    }

    enum EmploymentStatus {
        ACTIVE,
        PROBATION,
        TERMINATED
    }
    error EMPLOYEE_NOT_FOUND();
    error EMPLOYEE_IS_NOT_ACTIVE();
    error NOT_THE_OWNER();

    function addEmployee(
        string calldata name,
        string calldata role,
        address payable walletAddress,
        uint256 salary
    ) external;

    function getEmployee(
        address _employeeWallet
    ) external returns (Employee memory);

    function updateEmployee(
        string memory name,
        string memory role,
        address payable walletAddress,
        uint256 salary
    ) external;

    function updateEmployeeStatus(
        address _employeeAddress,
        EmploymentStatus _status
    ) external;

    function paySalary(address payable _employeeAddress) external payable;
}

contract EmployeeManagementSystem is IEmployeeManagementSystem {
    mapping(address => Employee) listOfEmployees;
    uint uid;
    address owner;

    constructor() {
        owner = msg.sender;
    }

    function addEmployee(
        string calldata _name,
        string calldata _role,
        address payable _walletAddress,
        uint256 _salary
    ) external {
        if (msg.sender != owner) revert NOT_THE_OWNER();
        uid = uid + 1;

        listOfEmployees[_walletAddress] = Employee({
            id: uid,
            name: _name,
            role: _role,
            walletAddress: _walletAddress,
            salary: _salary,
            employmentStatus: EmploymentStatus.ACTIVE
        });
    }

    function getEmployee(
        address _employeeWallet
    ) public view returns (Employee memory) {
        return listOfEmployees[_employeeWallet];
    }

    function updateEmployeeStatus(
        address _employeeAddress,
        EmploymentStatus _status
    ) external {
        Employee storage employee = listOfEmployees[_employeeAddress];
        if (
            employee.walletAddress == address(0) ||
            employee.walletAddress != _employeeAddress
        ) revert EMPLOYEE_NOT_FOUND();

        employee.employmentStatus = _status;
    }

    function updateEmployee(
        string calldata _name,
        string calldata _role,
        address payable _walletAddress,
        uint256 _salary
    ) external {
        if (msg.sender != owner) revert NOT_THE_OWNER();

        Employee storage employee = listOfEmployees[_walletAddress];
        employee.name = _name;
        employee.role = _role;
        employee.salary = _salary;
    }

    function paySalary(address payable _employeeAddress) external payable {
        if (msg.sender != owner) revert NOT_THE_OWNER();

        Employee memory employee = listOfEmployees[_employeeAddress];
        if (
            employee.walletAddress == address(0) ||
            employee.walletAddress != _employeeAddress
        ) revert EMPLOYEE_NOT_FOUND();
        if (employee.employmentStatus != EmploymentStatus.ACTIVE)
            revert EMPLOYEE_IS_NOT_ACTIVE();

        (bool sent, ) = _employeeAddress.call{value: employee.salary}("");
        require(sent, "Failed to send Ether");
    }
}
