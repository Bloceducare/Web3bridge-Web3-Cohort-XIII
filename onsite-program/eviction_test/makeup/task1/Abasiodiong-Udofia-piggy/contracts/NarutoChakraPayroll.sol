// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IERC20.sol";

contract NarutoChakraPayroll is Ownable {
    IERC20 public immutable payrollToken;
    uint256 public constant CHECKINS_REQUIRED = 5;
    uint256 public constant SECONDS_PER_DAY = 24 * 60 * 60;

    struct Employee {
        uint256 id;
        string name;
        address wallet;
        uint256 salary;
        uint256 lastCheckIn;
        uint256 checkInCount;
        bool exists;
    }

    mapping(uint256 => Employee) public employees;
    uint256 public employeeCount;

    event EmployeeRegistered(uint256 indexed id, string name, address wallet, uint256 salary);
    event EmployeeCheckedIn(uint256 indexed id, uint256 checkInCount);
    event PayoutReceived(uint256 indexed id, uint256 amount);

    constructor(address _payrollToken) Ownable(msg.sender) {
        payrollToken = IERC20(_payrollToken);
    }

    function registerEmployee(string memory _name, address _wallet, uint256 _salary) external onlyOwner {
        require(_wallet != address(0), "Invalid wallet address");
        require(_salary > 0, "Salary must be greater than zero");
        require(bytes(_name).length > 0, "Name cannot be empty");

        employeeCount++;
        employees[employeeCount] = Employee(employeeCount, _name, _wallet, _salary, 0, 0, true);
        emit EmployeeRegistered(employeeCount, _name, _wallet, _salary);
    }

    function checkIn(uint256 _id) external {
        Employee storage employee = employees[_id];
        require(employee.exists, "Employee not registered");
        require(employee.wallet == msg.sender, "Only employee can check in");
        require(block.timestamp >= employee.lastCheckIn + SECONDS_PER_DAY, "Already checked in today");
        require(employee.checkInCount < CHECKINS_REQUIRED, "Check-in limit reached");

        employee.lastCheckIn = block.timestamp;
        employee.checkInCount++;
        emit EmployeeCheckedIn(_id, employee.checkInCount);
    }

    function requestPayout(uint256 _id) external {
        Employee storage employee = employees[_id];
        require(employee.exists, "Employee not registered");
        require(employee.wallet == msg.sender, "Only employee can request payout");
        require(employee.checkInCount == CHECKINS_REQUIRED, "Incomplete check-ins");
        require(payrollToken.balanceOf(address(this)) >= employee.salary, "Insufficient contract balance");

        employee.checkInCount = 0;
        require(payrollToken.transfer(employee.wallet, employee.salary), "Payout transfer failed");
        emit PayoutReceived(_id, employee.salary);
    }

    // Admin function to fund the contract
    function fundContract(uint256 _amount) external onlyOwner {
        require(payrollToken.transferFrom(msg.sender, address(this), _amount), "Funding failed");
    }
}