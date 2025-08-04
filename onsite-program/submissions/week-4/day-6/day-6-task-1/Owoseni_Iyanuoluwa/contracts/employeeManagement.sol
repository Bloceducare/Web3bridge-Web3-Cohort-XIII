//SPDX-License-Identifier:MIT
pragma solidity ^0.8.28;

interface IManager {
    function transfer(address employeeAddress, uint256 salary) external returns (bool);
}

contract Management is IManager{
    error EmployeeAlreadyExists();
    error InvalidRecipient();
    error InsufficientBalance();
    error OnlyOwnerCanCall();
    error EmployeeDoesNotExist();
    error OnlyOwnerCanUpdateSalary();
    error OnlyOwnerCanUpdateStatus();
    enum Manage{
        employed,
        not_employed,
        on_probation
    }
    
    enum roles{
        Mentor,
        Security,
        Cooks
    }


    struct Employee{
        string name;
        uint256 salary;
        Manage status;
        bool exists;
        address employeeAddress;
        roles role;
    }

    Employee[] public employee;
    address public owner = msg.sender;

    mapping(address => Employee) public employees;
    mapping(address => uint256) public balances;
    // mapping(address => roles) public employeeRoles;

    
        // owner = msg.sender;


    function createEmployee(address employeeAddress, string memory name, uint salary, roles role ) external{
        require(!employees[employeeAddress].exists, "Employee already exists");
        Employee memory newEmployees = Employee(name, salary, Manage.employed, true, employeeAddress, role);
        employees[employeeAddress] = newEmployees;
        employee.push(newEmployees);

        // employees[employeeAddress] = Employee(name, salary, Manage.employed, true, employeeAddress);
        // balances[employeeAddress] = salary;
        // employeeRoles[employeeAddress] = roles.Mentor;
    }
    receive() external payable {
    }

    function transfer( address employeeAddress, uint salary) external returns (bool){
        // require(employeeAddress != address(0), "Invalid recipient");
        if (employeeAddress == address(0)) {
            revert InvalidRecipient();
        }
        require(employees[employeeAddress].exists, "Recipient is not an employee");
        require(balances[msg.sender] >= salary, "Insufficient balance");
        require (msg.sender == owner);
        require (employees[employeeAddress].status == Manage.employed);
        require (employees[employeeAddress].salary == salary);

        balances[msg.sender] -= salary;
        balances[employeeAddress] += salary;
        payable(employeeAddress).transfer(salary);
        return true;
    } 

    function getContractBalance() external view returns (uint256) {
        // return balances[address(this)];
        return address(this).balance;
    }
   



}