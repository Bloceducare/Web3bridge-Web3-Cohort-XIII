// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IEmployeeManage {
    function registerEmployee(address _user, string memory _name, Role _role, uint _salary) external;
    function paySalary(address payable _user, uint _amount) external payable;
    function getUser(address _user) external view returns (Employee memory);
    function getAllUsers() external view returns (Employee[] memory); 

 contract EmployeeManagement is IEmployeeManage {
    enum Role { Lecturer, Non_Teaching, Securirty}
    enum Status { Employed, Not_Employed, Probation }

    struct Employee {
        address wallet;
        string name;
        Role role;
        uint salary;
        uint amountPaid;
        Status status;
    }

    mapping(address => Employee) private employeeRecords;
    address[] private userList;

    address public owner;

    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    function registerEmployee( address _user, string memory _name, Role _role, uint _salary) external onlyOwner {
        require(_user != address(0), "Invalid address.");
        require(employeeRecords[_user].wallet == address(0), "User already registered.");
        require(_salary > 0, "Salary must be greater than zero.");

        employeeRecords[_user] = Employee({
            wallet: _user,
            name: _name,
            role: _role,
            salary: _salary,
            amountPaid: 0,
            status: Status.EMPLOYED
        });

        userList.push(_user);
    }

    function paySalary(address payable _user, uint _amount) external payable onlyOwner userExists(_user)
    {
        Employee storage emp = employeeRecords[_user];

        require(emp.status == Status.EMPLOYED, "User not employed.");
        require(_amount > 0, "Amount must be greater than zero.");
        require(emp.amountPaid + _amount <= emp.salary, "Amount exceeds agreed salary.");
        require(address(this).balance >= _amount, "Insufficient contract balance.");

        emp.amountPaid += _amount;
        _user.transfer(_amount);
    }

    function getUser(address _user) external view userExists(_user)
        returns (Employee memory)
    {
        return employeeRecords[_user];
    }

    function getAllUsers() external view returns (Employee[] memory) {
        Employee[] memory allEmployees = new Employee[](userList.length);
        for (uint i = 0; i < userList.length; i++) {
            allEmployees[i] = employeeRecords[userList[i]];
        }
        return allEmployees;
    }

    receive() external payable {}
}