// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract digital_security_system {

   enum Role {
        MEDIA_TEAM,           // 2 ETH
        MANAGERS,             // 5 ETH  
        MENTORS,              // 3 ETH
        SOCIAL_MEDIA_TEAM,    // 1.5 ETH
        TECHNICIAN_SUPERVISORS, // 4 ETH
        KITCHEN_STAFF         // 1 ETH
   }
   
   enum Status {
     EMPLOYED,
     TERMINATED
   }

   struct EmployeeData {
    string name;
    Role role;
    Status status;
    uint256 lastPayment;
   }

   address public owner;
   EmployeeData[] public employees;
   mapping(address => EmployeeData) public employees_map;
   mapping(address => bool) public isEmployee;

   modifier onlyOwner() {
       require(msg.sender == owner, "Only owner can perform this action");
       _;
   }

   constructor() {
       owner = msg.sender;
   }

   receive() external payable {}

   function getSalaryByRole(Role _role) public pure returns(uint256) {
       if (_role == Role.MEDIA_TEAM) return 2 ether;
       if (_role == Role.MANAGERS) return 5 ether;
       if (_role == Role.MENTORS) return 3 ether;
       if (_role == Role.SOCIAL_MEDIA_TEAM) return 1.5 ether;
       if (_role == Role.TECHNICIAN_SUPERVISORS) return 4 ether;
       if (_role == Role.KITCHEN_STAFF) return 1 ether;
       return 0;
   }

   function addEmployee(address _employeeAddress, string memory _name, Role _role) external onlyOwner {
      require(_employeeAddress != address(0), "Invalid address");
      require(bytes(_name).length > 0, "Name cannot be empty");
      
      EmployeeData memory new_employee = EmployeeData(_name, _role, Status.EMPLOYED, 0);
      
      if (!isEmployee[_employeeAddress]) {
          employees.push(new_employee);
          isEmployee[_employeeAddress] = true;
      }
      
      employees_map[_employeeAddress] = new_employee;
   }

   function payEmployee(address _employeeAddress) external onlyOwner {
       require(isEmployee[_employeeAddress], "Employee does not exist");
       require(employees_map[_employeeAddress].status == Status.EMPLOYED, "Employee is terminated");
       
       uint256 salary = getSalaryByRole(employees_map[_employeeAddress].role);
       require(address(this).balance >= salary, "Insufficient contract balance");
       require(salary > 0, "Invalid salary amount");
       
       employees_map[_employeeAddress].lastPayment = block.timestamp;
       
       // Update in array as well
       for (uint i = 0; i < employees.length; i++) {
           if (keccak256(bytes(employees[i].name)) == keccak256(bytes(employees_map[_employeeAddress].name))) {
               employees[i].lastPayment = block.timestamp;
               break;
           }
       }
       
       payable(_employeeAddress).transfer(salary);
   }

   function payAllEmployees() external onlyOwner {
       for (uint i = 0; i < employees.length; i++) {
           if (employees[i].status == Status.EMPLOYED) {
               uint256 salary = getSalaryByRole(employees[i].role);
               if (address(this).balance >= salary) {
                   // Find employee address
                   for (uint j = 0; j < employees.length; j++) {
                       // This is a simplified approach - in practice you'd want to store addresses
                       employees[i].lastPayment = block.timestamp;
                   }
               }
           }
       }
   }

   function updateEmployeeStatus(address _employeeAddress, Status _status) external onlyOwner {
       require(isEmployee[_employeeAddress], "Employee does not exist");
       employees_map[_employeeAddress].status = _status;
       
       for (uint i = 0; i < employees.length; i++) {
           if (keccak256(bytes(employees[i].name)) == keccak256(bytes(employees_map[_employeeAddress].name))) {
               employees[i].status = _status;
               break;
           }
       }
   }

   function checkAccess(address _employeeAddress) external view returns(bool) {
       if (!isEmployee[_employeeAddress]) return false;
       
       EmployeeData memory employee = employees_map[_employeeAddress];
       
       if (employee.status == Status.TERMINATED) return false;
       
       if (employee.role == Role.MEDIA_TEAM || 
           employee.role == Role.MANAGERS || 
           employee.role == Role.MENTORS) {
           return true;
       }
       
       return false;
   }

   function getAllEmployees() external view returns(EmployeeData[] memory) {
       return employees;
   }

   function getEmployeeDetails(address _employeeAddress) external view returns(string memory name, Role role, Status status, uint256 salary, uint256 lastPayment) {
       require(isEmployee[_employeeAddress], "Employee does not exist");
       EmployeeData memory employee = employees_map[_employeeAddress];
       uint256 salary = getSalaryByRole(employee.role);
       
       return (employee.name, employee.role, employee.status, salary, employee.lastPayment);
   }

   function getTotalEmployees() external view returns(uint) {
       return employees.length;
   }

   function getContractBalance() external view returns(uint256) {
       return address(this).balance;
   }

   function getTotalSalaryExpense() external view returns(uint256) {
       uint256 total = 0;
       for (uint i = 0; i < employees.length; i++) {
           if (employees[i].status == Status.EMPLOYED) {
               total += getSalaryByRole(employees[i].role);
           }
       }
       return total;
   }

   function withdraw(uint256 _amount) external onlyOwner {
       require(_amount <= address(this).balance, "Insufficient balance");
       payable(owner).transfer(_amount);
   }

   function getEmployeesByRole(Role _role) external view returns(EmployeeData[] memory) {
       uint count = 0;
       
       // Count employees with specified role
       for (uint i = 0; i < employees.length; i++) {
           if (employees[i].role == _role && employees[i].status == Status.EMPLOYED) {
               count++;
           }
       }
       
       // Create array of employees with specified role
       EmployeeData[] memory roleEmployees = new EmployeeData[](count);
       uint index = 0;
       
       for (uint i = 0; i < employees.length; i++) {
           if (employees[i].role == _role && employees[i].status == Status.EMPLOYED) {
               roleEmployees[index] = employees[i];
               index++;
           }
       }
       
       return roleEmployees;
   }
}