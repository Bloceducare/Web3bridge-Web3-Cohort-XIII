// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

contract Entry {
    
  
    enum role {MEDIA, MENTORS, MANAGERS, SOCIAL, TECHNICIAN, KITCHEN}
   
    struct Employee {
        string name;
        role role;
        bool employed;
        address Owner;
        
   
    }
    address public Owner;

    constructor() {
        Owner = msg.sender;
    }


    Employee[] public employees;

    mapping (address => Employee) public employee;


    function addEmployee(string memory _name, role _role, bool employed) external  {
       Employee memory newEmployee = Employee(_name, _role, employed, Owner);
       employee[msg.sender]= newEmployee;
       employees.push(newEmployee);
    }

    function updateName(string memory _name, address _employeeAddress) external  {
      employee[_employeeAddress].name = _name; 
      for (uint256 i; i< employees.length; i++) 
      {
        if (employees[i].Owner == _employeeAddress) {
            employees[i].name = _name;
        }
      }
      return ;
         
    }

    function updateEmployed(bool _employed, address _employeeAddress) external  {
      employee[_employeeAddress].employed = _employed; 
      for (uint256 i; i< employees.length; i++) 
      {
        if (employees[i].Owner == _employeeAddress) {
            employees[i].employed = _employed;
        }
      }
      return ;
         
    }

    // function updateEmployee() {
    //     code
    // }

    function checkAccess(address _employeeAddress) external view returns (bool) {
        for (uint256 i; i< employees.length; i++) 
        {
            if (employees[i].Owner == _employeeAddress) {
                return employees[i].employed && (employees[i].role == role.MEDIA || employees[i].role == role.MENTORS || employees[i].role == role.MANAGERS);
            }
        }
        return false;
    }

    

    function getAllEmployees() external view returns (Employee[] memory) {
        return employees;
    }
    
    // function getEmployees(params) {
    //     code
    // }
}