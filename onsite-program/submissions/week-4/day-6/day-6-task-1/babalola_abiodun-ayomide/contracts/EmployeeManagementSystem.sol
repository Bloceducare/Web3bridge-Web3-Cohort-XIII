// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

enum Role{MENTORS,ADMIN,SECURITY}

interface IEmployeeManagement{
    function registerEmployee(string memory  name, Role role, uint salary, address userAddress) external;
}
struct User{
    bool isEmployed;
    uint salary;
    string name;
    Role role;

}
library Errors{
    error INVALID_ADDRESS();
    error INVALID_SALARY();
    error NOT_EMPLOYED();
}

contract EmployeeManagementSystem is IEmployeeManagement{
     fallback() external payable {}
     
     receive() external payable {}
     mapping (address=>User) private users;
     User[] allEmployees;
     
    function registerEmployee(string memory  name, Role role, uint salary, address userAddress) external {
        User memory user = User(true,salary,name,role);
        users[userAddress] = user;
        allEmployees.push();
    }

    function getAllUsers() external view returns (User[] memory) {
        return allEmployees;
    }

    function paySalary(address userAddress) external payable {
        User memory userGotten = users[userAddress];
        if(users[userAddress].salary > 0){
            revert Errors.INVALID_ADDRESS();
        }
        if(msg.value != userGotten.salary ){
            revert Errors.INVALID_SALARY();
        }
        if(userGotten.isEmployed == false){
            revert Errors.NOT_EMPLOYED();
        }
        payable(userAddress).transfer(userGotten.salary);
    }
}