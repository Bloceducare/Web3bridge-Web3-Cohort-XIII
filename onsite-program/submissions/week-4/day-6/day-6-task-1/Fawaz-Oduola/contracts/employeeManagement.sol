// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;
import "./interface/employeeManagement.sol";

contract EmployeeManagement is IEmployeeManagement {

    Employee[] public employees;

    mapping(address => Employee) addressToEmployee;


    receive() external payable { }


    function addEmployee(string memory _name, address _address, EmployeePosition _position, uint256 _salary) external returns(bool){
        Employee memory newEmployee = Employee(_name, _address, _salary, _position, Status.EMPLOYED);
        employees.push(newEmployee);
        addressToEmployee[_address] = newEmployee;
        return true; 
    }


    function payEmployee(address _address) external {
        Employee memory employee = addressToEmployee[_address];
        if (employee.status != Status.EMPLOYED) {
            revert("Employee not eligible for payment");
        }
        payable(_address).transfer(employee.salary);
    }

    function getEmployee(address _address) external  view returns(Employee memory){
        return addressToEmployee[_address];
    }

    function convertEthToWei(uint256 _eth) internal pure returns(uint256){
        return _eth * 1e18;
    }

    function fundContract() external payable {}

    

}