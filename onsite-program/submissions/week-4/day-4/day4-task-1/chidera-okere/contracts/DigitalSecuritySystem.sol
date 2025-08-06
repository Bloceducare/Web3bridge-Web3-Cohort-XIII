// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract EmployeeManagement {

    enum Status {
        EMPLOYED,  // Fixed typo: was "EMPLOYEED"
        TERMINATED
    }  

    enum Role {
        MEDIA_TEAM,
        KITCHEN_STAFF,
        MENTORS,
        ENGINEERS
    }  

    struct EmployeeData {
        string name;
        Status status;
        uint256 salary;
        Role role;
        bool grantedAccess;
    }

    // state variables
    EmployeeData[] public employees;
    mapping(address => EmployeeData) public addressToEmployee;

    function create_employee(string memory _name, Role _role, address _address) external {
        if(bytes(_name).length == 0) {
            revert("Name cannot be empty");
        }
        
        EmployeeData memory new_employee = EmployeeData({
            name: _name,
            status: Status.EMPLOYED,  
            role: _role,  
            salary: set_salary(_role),
            grantedAccess: grant_access(_role)
        });

        employees.push(new_employee);
        addressToEmployee[_address] = new_employee;
    }

    function grant_access(Role _role) internal pure returns(bool) {
        if (_role == Role.MENTORS || _role == Role.ENGINEERS) {
            return true;  
        }
        return false;
    }

    function set_salary(Role _role) internal pure returns(uint256) {  
        if (_role == Role.MENTORS) {  
            return 10;
        } else if (_role == Role.MEDIA_TEAM) {
            return 5;
        } else if (_role == Role.KITCHEN_STAFF) {
            return 3;
        } else if (_role == Role.ENGINEERS) {
            return 8;
        } else {
            revert("Invalid role");
        }
    }

    function pay_employee(address payable _address) external payable returns(uint256) {
        EmployeeData memory employee_pay = addressToEmployee[_address];

        if(employee_pay.status != Status.EMPLOYED) {
            revert("Employee not employed");
        }

        // Convert salary to wei
        uint256 salary_wei = employee_pay.salary * 1 ether;
        
        // Check contract has enough balance
        require(address(this).balance >= salary_wei, "Insufficient contract balance");
        
        _address.transfer(salary_wei);
        return salary_wei;
    }
    
    // Function to allow contract to receive ether
    receive() external payable {}
    
    // Function to check contract balance
    function getContractBalance() external view returns(uint256) {
        return address(this).balance;
    }
    
    // Function to get employee details
    function getEmployee(address _address) external view returns(EmployeeData memory) {
        return addressToEmployee[_address];
    }
}