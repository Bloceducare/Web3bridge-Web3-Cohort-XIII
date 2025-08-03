// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;
import "./interface/ITeacherSalaryManager.sol";

contract TeacherSalaryManager is ITeacherSalaryManager {

    mapping(address => Staff) public addressToStaff;
    Staff[] public allStaff;

    address public owner;

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }

    function addTeacher(
        string memory _name,
        Status _status,
        Role _role
    ) external {
        require(addressToStaff[msg.sender].salary == 0, "Teacher already exists");

        uint256 _salary;

        if (_role == Role.ADMIN) {
            _salary = 1100;
        } else if (_role == Role.MENTOR) {
            _salary = 1000;
        } else {
            _salary = 500;
        }

        if (_status == Status.PROBATION) {
            _salary = 400; // 700 - 300
        } else if (_status == Status.UNEMPLOYED) {
            _salary = 0;
        }

        addressToStaff[msg.sender] = Staff(_name, _salary, _status, _role);
        allStaff.push(addressToStaff[msg.sender]);
    }

    function getStaff(address _address) external view returns (Staff memory) {
        return addressToStaff[_address];
    }

    function getTotalStaffs() external view returns (uint256) {
        return allStaff.length;
    }

    function updateStaffStatus(address _address, Status _status) external onlyOwner {
        addressToStaff[_address].status = _status;
    }

    // Function to pay salary
    function paySalary(address payable _staffAddress) external onlyOwner {
        Staff memory staff = addressToStaff[_staffAddress];
        require(staff.salary > 0, "No salary assigned");
        require(staff.status == Status.EMPLOYED, "Staff not employed");

        uint256 amount = staff.salary * 1 ether;
        require(address(this).balance >= amount, "Insufficient contract balance");

        _staffAddress.transfer(amount);
    }

    // Function to fund the contract
    receive() external payable {}
}
