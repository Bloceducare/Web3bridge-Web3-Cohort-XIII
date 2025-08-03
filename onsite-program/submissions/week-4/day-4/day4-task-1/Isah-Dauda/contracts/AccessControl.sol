// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

contract garageAccess{

    enum Role{
        MediaTeam,
        Mentors,
        Managers,
        SocialMediaTeam,
        TechnicianSupervisors,
        KitchenStaff
    }

    address Founder;

    // constructor(address){
    //     Founder = msg.sender;
    // }

    error ONLY_FOUNDER();

    modifier onlyFounder(address){
        // require(msg.sender == Founder, "Oops");
        if(msg.sender != Founder){
            revert ONLY_FOUNDER();
        }
        _;
    }

    struct Employee{
        string name;
        Role role;
        bool isEmployed;
    }

    mapping(address => Employee) public employeeData;

    address [] public employeeList;

    function addUpdateEmployee(address _address, string memory _name, Role _role, bool _isEmployed) public onlyFounder(msg.sender) {
        Employee memory new_employee = Employee(_name, _role, _isEmployed);
        employeeData[_address] = new_employee;

        bool alreadyEmployed = false; 

        if(!alreadyEmployed) {
            employeeList.push(_address);
        }
        
        for (uint i = 0; i < employeeList.length; i++){
            if(employeeList[i] == _address){
                alreadyEmployed = true;
                return;
            }
        }

      
    }

    function hasAccess(address _address) public view returns(bool) {
        Employee memory new_employee = employeeData[_address];
        if (!new_employee.isEmployed) {
            return false;
        }

        if (
            new_employee.role == Role.MediaTeam || 
            new_employee.role == Role.Mentors ||
            new_employee.role == Role.Managers
        ){
            return true;
        } return false;
    }

    function getEntireEmployees() external view returns(address[] memory) {
        return employeeList;
    }

    function getEmployee(address _addressOf) external  view returns (Employee memory){
        return employeeData[_addressOf];
    }

    function deleteEmployee(address _address) external onlyFounder(msg.sender) {
    require(bytes(employeeData[_address].name).length != 0, "Employee does not exist");

    delete employeeData[_address];

    for (uint i = 0; i < employeeList.length; i++) {
        if (employeeList[i] == _address) {
            employeeList[i] = employeeList[employeeList.length - 1];
            employeeList.pop();
            return;
        }
    }
}

}
