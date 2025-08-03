//SPDX-License-Identifier:MIT
pragma solidity 0.8.30;

contract AccessControl{
    address HR;
   /* constructor(address){
        HR=msg.sender;
    }*/
    error onlyHR();
    modifier onlyAdmin(address){
        if(msg.sender!=HR){
            revert onlyHR();
        }
        _;
    }
      
    enum Role{
       MediaTeam, Mentor,Manager,SocialMediaTeam,TechnicalSupervisor,KitchenStaff,Terminated
    }
    struct Employee{
        string name;
        Role role;
        bool isEmployed;
    }
    mapping(address=>Employee)public employees;
    address[]public EmployeesList;
    function addUpdateEmployee(address _address,string memory _name,Role _role,bool _isEmployed)external onlyAdmin(msg.sender){
        Employee memory newEmployee=Employee(_name,_role,_isEmployed);
        employees[_address]=newEmployee;
        bool AlreadyEmployed;
        for(uint i=0;i<EmployeesList.length;i++){
            if(EmployeesList[i]==_address){
             AlreadyEmployed=true;
             return;
            }  
        }
           if(!AlreadyEmployed){
            EmployeesList.push(_address);
        }
    }
    function hasAccess(address _address)external view returns (bool){
        Employee memory newEmployee=employees[_address];
      if(!newEmployee.isEmployed){
        return false;
      }
      
         if(newEmployee.role==Role.Manager||newEmployee.role==Role.MediaTeam||newEmployee.role==Role.Mentor){
            return true;
        }
        return false;
      
    }
    function getAllEmployees()external view returns(address[]memory){
        return EmployeesList;
    }
    function getEmployee(address _address)external view returns (Employee memory){
        return employees[_address];
    }
}
