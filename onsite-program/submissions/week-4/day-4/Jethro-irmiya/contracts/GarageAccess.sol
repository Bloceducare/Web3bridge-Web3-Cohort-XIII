
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract GarageAccess {
    enum Role {
        MediaTeam,
        Mentor,
        Manager,
        SocialMediaTeam,
        TechnicianSupervisor,
        KitchenStaff
    }

    struct Employee {
        string name;
        Role role;
        bool isEmployed;
        uint256 lastPaymentTimestamp;
        uint256 totalPaymentsReceived;
    }

    mapping(address => Employee) public employees;
    address[] public employeeList;
    address public owner;
    uint256 public constant PAYMENT_AMOUNT = 0.1 ether; 

    
    event EmployeePaid(address indexed employee, uint256 amount, uint256 timestamp);
    event FundsDeposited(address indexed sender, uint256 amount);
    event FundsWithdrawn(address indexed owner, uint256 amount);

    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    
    function depositFunds() public payable {
        require(msg.value > 0, "Must deposit some Ether");
        emit FundsDeposited(msg.sender, msg.value);
    }

    
    function getContractBalance() public view returns (uint256) {
        return address(this).balance;
    }

    
    function withdrawFunds(uint256 _amount) public onlyOwner {
        require(_amount <= address(this).balance, "Insufficient contract balance");
        payable(owner).transfer(_amount);
        emit FundsWithdrawn(owner, _amount);
    }

    function addOrUpdateEmployee(address _employeeAddress, string memory _name, Role _role, bool _isEmployed) public onlyOwner {
        bool exists = false;
        for (uint i = 0; i < employeeList.length; i++) {
            if (employeeList[i] == _employeeAddress) {
                exists = true;
                break;
            }
        }

        if (!exists) {
            employeeList.push(_employeeAddress);
        }

        employees[_employeeAddress] = Employee({
            name: _name,
            role: _role,
            isEmployed: _isEmployed,
            lastPaymentTimestamp: 0,
            totalPaymentsReceived: 0
        });
    }

    function canAccessGarage(address _employeeAddress) public view returns (bool) {
        Employee memory employee = employees[_employeeAddress];
        
        if (!employee.isEmployed) {
            return false;
        }

        return (employee.role == Role.MediaTeam ||
                employee.role == Role.Mentor ||
                employee.role == Role.Manager);
    }

    
    function payEmployee(address _employeeAddress) public onlyOwner {
        require(canAccessGarage(_employeeAddress), "Employee does not have garage access");
        require(address(this).balance >= PAYMENT_AMOUNT, "Insufficient contract balance");
        
        Employee storage employee = employees[_employeeAddress];
        
        
        employee.lastPaymentTimestamp = block.timestamp;
        employee.totalPaymentsReceived += PAYMENT_AMOUNT;

        
        payable(_employeeAddress).transfer(PAYMENT_AMOUNT);
        emit EmployeePaid(_employeeAddress, PAYMENT_AMOUNT, block.timestamp);
    }

    function getAllEmployees() public view returns (address[] memory) {
        return employeeList;
    }

    function getEmployeeDetails(address _employeeAddress) public view returns (
        string memory name,
        Role role,
        bool isEmployed,
        uint256 lastPaymentTimestamp,
        uint256 totalPaymentsReceived
    ) {
        Employee memory employee = employees[_employeeAddress];
        return (
            employee.name,
            employee.role,
            employee.isEmployed,
            employee.lastPaymentTimestamp,
            employee.totalPaymentsReceived
        );
    }
}