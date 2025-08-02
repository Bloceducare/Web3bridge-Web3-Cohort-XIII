// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

contract AccessControl{
    address HR;
   /* constructor(address){
      HR=msg.sender;
    }*/
    error onlyHR();
    modifier onlyAdmin(){
        if(msg.sender!=HR){
         revert onlyHR();
         
        }
        _;
    }
    enum Role{Manager,Mentor,Cleaner,KitchenStaff,Terminated}
    struct EmployeeData{
        string name;
        Role role;
    }
    mapping (address=>EmployeeData) employees;
    mapping (address=>bool) isEmployed;
    address[] public EmployeesList;
    function addEmployee(address _address, string memory _name, Role _role) external onlyAdmin(){
       EmployeeData memory newEmployee=EmployeeData(_name,_role);
       employees[_address]=newEmployee;
       if(!isEmployed[_address]){
        isEmployed[_address]=true;
        EmployeesList.push(_address);
       }
    }
       function checkRole(address _address) public view returns(string memory) {
          EmployeeData memory getData=employees[_address];
          if(getData.role==Role.Manager)return "Manager";
          if(getData.role==Role.Mentor)return "Mentor";
          if(getData.role==Role.Cleaner)return "Cleaner";
          if(getData.role==Role.KitchenStaff)return "KitchenStaff";
          return  "Unknown/Fired";
    }
    function hasAccess(address _address) external view returns(string memory){
          EmployeeData memory getData=employees[_address];
          if(getData.role==Role.Manager||getData.role==Role.Mentor){
            return "This employee has access";
          }
          if(getData.role==Role.Cleaner||getData.role==Role.KitchenStaff)return "This employee does not have access";
          return "This employee does not exist or has been fired";
    }
     function fireEmployee(address _address) external {
        employees[_address].role=Role.Terminated;
        isEmployed[_address]=false;
       
     }
    function getEmployee(address _address) external view returns(string memory ,string memory ,bool){
        EmployeeData memory getData=employees[_address];
        return (getData.name,checkRole(_address),isEmployed[_address]);
    }

 function getAllEmployee()external view returns(address[]memory){
    return EmployeesList;
 }   
}












