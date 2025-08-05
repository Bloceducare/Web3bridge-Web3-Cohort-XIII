// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
 import "./CompanyInterface.sol";
 import "./Error.sol";
 import "./Ether.sol";

contract Company is ICompany {


    mapping (address => Employee) myEmployees;

    // address private ownersAddress;
    // constructor (){
    //     ownersAddress = msg.sender;
    // }


    function createEmployee(string memory _name) external {
        require(myEmployees[msg.sender].employeeAddress == address(0), Error.EMPLOYEE_ALREADY_EXIST());
        Employee memory newEmployee;
        newEmployee.name = _name; newEmployee.status = Status.ACTIVE; newEmployee.employeeAddress = msg.sender;
        myEmployees[msg.sender] = newEmployee;

    }
    function setEmployeeSalary(address _employeeAddress, uint amount) external {
        require(myEmployees[_employeeAddress].employeeAddress != address(0), Error.EMPLOYEE_NOT_FOUND());
        require(myEmployees[_employeeAddress].status == Status.ACTIVE, Error.EMPLOYEE_NOT_ACTIVE());
        myEmployees[_employeeAddress].salary = amount;
    }

    function getEmployee (address _employeeAddress) external view returns (Employee memory){
        return myEmployees[_employeeAddress];

    }

    function paySalary(address _employeeAddress) external{
        // require(ownersAddress == msg.sender, Error.NOT_OWNERS_ADDRESS());
        require(myEmployees[_employeeAddress].employeeAddress != address(0), Error.EMPLOYEE_NOT_FOUND());
        require(myEmployees[_employeeAddress].status == Status.ACTIVE, Error.EMPLOYEE_NOT_ACTIVE());

        payable(_employeeAddress).transfer(myEmployees[_employeeAddress].salary);

        // Ether.transfer(_employeeAddress, myEmployees[_employeeAddress].salary);
        
    }


    function updateEmployeeStatus(address _employeeAddress, Status status) external{
        // require(ownersAddress == msg.sender, Error.NOT_OWNERS_ADDRESS());
        require(myEmployees[_employeeAddress].employeeAddress != address(0), Error.EMPLOYEE_NOT_FOUND());

        myEmployees[_employeeAddress].status = status;
    }

    function updateEmployeeDetails(address _employeeAddress, string memory _name)external{
        require(myEmployees[_employeeAddress].employeeAddress != address(0), Error.EMPLOYEE_NOT_FOUND());
        myEmployees[_employeeAddress].name = _name;
    }

    function updateEmployeeSalary(address _employeeAddress, uint _newSalary) external{
        // require(ownersAddress == msg.sender, Error.NOT_OWNERS_ADDRESS());
        require(myEmployees[_employeeAddress].employeeAddress != address(0), Error.EMPLOYEE_NOT_FOUND());
        require(myEmployees[_employeeAddress].status == Status.ACTIVE, Error.EMPLOYEE_NOT_ACTIVE());

        myEmployees[_employeeAddress].salary = _newSalary;
    }

    fallback() external {}

    receive() external payable {}



}