// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IEmployeeManagement {
    function registerEmployee(address user, string memory name, uint8 role, uint salary) external;
    function paySalary(address user) external payable;
    function getAllUsers() external view returns (address[] memory);
    function getEmployeeDetails(address user) external view returns (
        string memory name, string memory role, uint salary, uint totalPaid, bool employed
    );
    function isRegistered(address user) external view returns (bool);
}

contract ShcoolEmployeeManagement is IEmployeeManagement {
    address private VC;

    enum Role { Unknown, Mentor, Admin, Security }

    struct Employee {
        string name;
        Role role;
        uint salary;
        uint totalPaid;
        bool employed;
    }

    mapping(address => Employee) public employees;
    address[] private employeeList;

    
    error NotOwner();
    error AlreadyRegistered();
    error InvalidAddress();
    error InvalidName();
    error InvalidRole();
    error InvalidSalary();
    error NotEmployed();
    error UserNotFound();
    error Overpayment();
    error NoEtherSent();

    
    modifier onlyOwner() {
        if (msg.sender != VC) revert NotOwner();
        _;
    }

    modifier employeeExists(address user) {
        if (employees[user].role == Role.Unknown) revert UserNotFound();
        _;
    }

    
    function setVC(address newVC) external {
        if (VC != address(0)) revert NotOwner(); // Can only set once
        VC = newVC;
    }

    
    function registerEmployee(address user, string memory name, uint8 roleId, uint salary)
        external override onlyOwner
    {
        if (user == address(0)) revert InvalidAddress();
        if (bytes(name).length == 0) revert InvalidName();
        if (employees[user].role != Role.Unknown) revert AlreadyRegistered();
        if (salary == 0) revert InvalidSalary();
        if (roleId == 0 || roleId > 3) revert InvalidRole();

        employees[user] = Employee(name, Role(roleId), salary, 0, true);
        employeeList.push(user);
    }

    
    function paySalary(address user)
        external payable override onlyOwner employeeExists(user)
    {
        Employee storage emp = employees[user];
        if (!emp.employed) revert NotEmployed();
        if (msg.value == 0) revert NoEtherSent();
        if (emp.totalPaid + msg.value > emp.salary) revert Overpayment();

        emp.totalPaid += msg.value;
        payable(user).transfer(msg.value);
    }

    
    function terminateEmployee(address user) external onlyOwner employeeExists(user)
    {
        employees[user].employed = false;
    }

   
    function isRegistered(address user)public view override returns (bool)
    {
        return employees[user].role != Role.Unknown;
    }

    
    function getAllUsers()
        external view override returns (address[] memory)
    {
        return employeeList;
    }

    
    function getEmployeeDetails(address user)
        external view override employeeExists(user)
        returns (
            string memory name,
            string memory role,
            uint salary,
            uint totalPaid,
            bool employed
        )
    {
        Employee memory emp = employees[user];
        name = emp.name;
        role = _roleToString(emp.role);
        salary = emp.salary;
        totalPaid = emp.totalPaid;
        employed = emp.employed;
    }

    
    function _roleToString(Role role)internal pure returns (string memory)
    {
        if (role == Role.Mentor) return "Mentor";
        if (role == Role.Admin) return "Admin";
        if (role == Role.Security) return "Security";
        return "Unknown";
    }

    
    receive() external payable {}
    fallback() external payable{}
}
