// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract AccessMgt{

    enum Role{
        MediaTeam,
        Mentors,
        Managers,
        SocialMediaTeam,
        Technicians,
        KitchenStaff
    }
    struct Employee{
        string name;
        bool isEmployed;
        Role role;
    }

    Employee[] public employees;
    address[] public addresses;

    mapping(address => Employee) public roles;
    mapping(address=>bool) private existingEmployee;

    function add_and_update_Employee(string memory _name, Role _role, address _address) external {
        require(_address != address(0), "Invalid address");
        if(existingEmployee[_address] ==true){
            for(uint i; i< employees.length; i++){
            if(employees[i].isEmployed == true){
                employees[i].name = _name;
                employees[i].role = _role;
            }else{
                Employee memory newEmployee = Employee({
            name: _name,
            isEmployed: true,
            role: _role
        });
            roles[_address]= newEmployee;
            existingEmployee[_address]=true;
            employees.push(newEmployee);
            }
        }
        }
        
        
    }
    function fullAccess(address _address)external view returns(bool){
            return (
                existingEmployee[_address] == true &&
                (
                    roles[_address].role == Role.MediaTeam ||
                    roles[_address].role == Role.Mentors ||
                    roles[_address].role == Role.Managers
                )
            );        
    }

    function terminateEmployee(address _address) external{
        require(_address != address(0), "Invalid address");

        for(uint i; i< employees.length; i++){
            if(existingEmployee[_address] ==true){
                existingEmployee[_address]=false;
                roles[_address].isEmployed = false;
            }else{
                revert ("Employee does not exist");
            }
    }
    }

    function getEmployees() external view returns(Employee[] memory){
        return employees;
    }

    function getEmployeesById(address _address)external view returns (Employee memory){
        require(existingEmployee[_address], "Employee not found");
        return roles[_address];
    }
}