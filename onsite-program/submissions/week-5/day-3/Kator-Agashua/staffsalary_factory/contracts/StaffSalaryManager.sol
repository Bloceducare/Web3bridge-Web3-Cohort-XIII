// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;
import {IStaffSalaryManager} from "../interfaces/IStaffSalaryManager.sol";

contract StaffSalaryManager is IStaffSalaryManager {
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

    function addStaff(
        address _address,
        string memory _name,
        Role _role
    ) external onlyOwner {
        require(addressToStaff[_address].salary == 0, "Staff already exists");
        // A staff status must EMPLOYED when he/she is added.
        Status _status = Status.EMPLOYED;
        uint256 _salary = calculateSalary(_status, _role);

        addressToStaff[_address] = Staff(_name, _salary, _status, _role);
        allStaff.push(addressToStaff[_address]);
    }

    function getStaff(address _address) external view returns (Staff memory) {
        return addressToStaff[_address];
    }

    function getTotalStaffs() external view returns (uint256) {
        return allStaff.length;
    }

    function updateStaff(
        address _address,
        Status _status,
        Role _role
    ) external onlyOwner {
        uint256 _salary = calculateSalary(_status, _role);
        addressToStaff[_address].status = _status;
        addressToStaff[_address].role = _role;
        addressToStaff[_address].salary = _salary;
    }

    // Function to pay salary
    function paySalary(address payable _staffAddress) external onlyOwner {
        Staff memory staff = addressToStaff[_staffAddress];
        require(staff.salary > 0, "No salary assigned");
        require(staff.status == Status.EMPLOYED, "Staff not employed");

        uint256 amount = staff.salary * 1 ether;
        require(
            address(this).balance >= amount,
            "Insufficient contract balance"
        );

        _staffAddress.transfer(amount);
    }

    function calculateSalary(
        Status _status,
        Role _role
    ) internal pure returns (uint256) {
        uint256 _salary;
        if (_role == Role.ADMIN) {
            _salary = 1100;
        } else if (_role == Role.MENTOR) {
            _salary = 1000;
        } else {
            _salary = 500;
        }
        if (_status == Status.PROBATION) {
            _salary -= 300;
        } else if (_status == Status.UNEMPLOYED) {
            _salary = 0;
        }
        return _salary;
    }

    // Function to fund the contract
    receive() external payable {}
}
