// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract AccessMgt{

    enum Status{
        MEMBER,
        ADMIN
    }
    struct Employee{
        string name;
        bool isEmployed;
        Status status;
    }

    Employee[] public employees;
    address[] public addresses;

    mapping(address => Employee) public roles;
    mapping(address=>bool) private existingEmployee;

    function addEmployee(string memory _name, Status _status, address _address) external {
        require(_address != address(0), "Invalid address");

        Employee memory newEmployee = Employee({
            name: _name,
            isEmployed: true,
            status: _status
        });
        roles[_address]= newEmployee;
        employees.push(newEmployee);
    }

    function fullAccess(address _address)external view returns(bool){
        Employee memory emp = roles[_address];

        return emp.isEmployed && (emp.status == Status.ADMIN);
    }

    function getEmployees() external view returns(Employee[] memory){
        return employees;
    }

    function getEmployeesById(address _address)external view returns (Employee memory){
        require(existingEmployee[_address], "Employee not found");
        return roles[_address];
    }
}