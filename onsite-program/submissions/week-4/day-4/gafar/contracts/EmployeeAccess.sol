// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

enum EmployeeType {
    MANAGER,
    MENTOR,
    MEDIA,
    TECHNICAL_SUPERVISOR,
    SOCIAL_MEDIA,
    KITCHEN_STAFF
}

enum EmployeeStatus {
    EMPLOYED,
    TERMINATED
}

struct EmployeeData {
    string name;
    EmployeeType role;
    EmployeeStatus status;
}

error USER_NOT_FOUND();

contract EmployeeAccess {
    mapping(address => EmployeeData) employeeData;
    EmployeeData[] public allEmployee;

    function addEmployee(address _userAddress, string memory _name, EmployeeType _role) external {

        employeeData[_userAddress] = EmployeeData(_name, _role, EmployeeStatus.EMPLOYED);
        allEmployee.push(employeeData[_userAddress]);
    }

    function updateEmployee(address _userAddress, string memory _name, EmployeeType _role) external {
        if(_userAddress == address(0)){ 
            revert USER_NOT_FOUND();
        }
        EmployeeData storage employee = employeeData[_userAddress];

        employee.name = _name;
        employee.role = _role;
    }

    function updateEmployeeStatus(address _userAddress, EmployeeStatus _status) external {
        if(_userAddress == address(0)){ 
            revert USER_NOT_FOUND();
        }
        EmployeeData storage employee = employeeData[_userAddress];
        employee.status = _status;
    }

    function getAllEmployees() external view returns (EmployeeData[] memory){
        return allEmployee;
    }

    function getSingleEmployee(address _userAddress) external view returns (EmployeeData memory) {
        if(_userAddress == address(0)){ 
            revert USER_NOT_FOUND();
        }
        EmployeeData storage employee = employeeData[_userAddress];
        return employee;
    }

    function haveAccess(address _userAddress) external view returns (bool) {
        EmployeeType[3] memory accessEmployee = [EmployeeType.MANAGER, EmployeeType.MEDIA, EmployeeType.MENTOR];
        if(_userAddress == address(0)){ 
            revert USER_NOT_FOUND();
        }
        EmployeeData storage employee = employeeData[_userAddress];
        if(employee.status == EmployeeStatus.TERMINATED){
            return false;
        }
        for(uint i = 0; i < accessEmployee.length; i++){
            if(employee.role == accessEmployee[i]){
                return true;
            }
        }
        return false;
    }
}
