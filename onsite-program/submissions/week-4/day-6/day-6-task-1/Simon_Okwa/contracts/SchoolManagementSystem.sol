// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

interface ISchoolManagementSystem {
    enum EmployeeRole { MENTOR, ADMIN, SECURITY }

    struct EmployeeDetails {
        string name;
        EmployeeRole role;
        uint256 salary;
        bool isEmployed;
    }

    function register_employee(address _employee, string memory _name, EmployeeRole _role, uint256 _salary) external;
    function pay_salary(address _employee) external payable;
    function get_all_employees() external view returns (EmployeeDetails[] memory);
}

contract SchoolManagementSystem is ISchoolManagementSystem {
    error STUDENT_NOT_FOUND();
    error INVALID_ID();
    error INVALID_SENDER();
    error EMPLOYEE_NOT_FOUND();
    error EMPLOYEE_ALREADY_REGISTERED();
    error NOT_EMPLOYED();
    error EXCEEDS_SALARY();
    error ZERO_ADDRESS();
    error INVALID_ROLE();

    enum Status { ACTIVE, DEFERRED, RUSTICATED }

    struct StudentDetails {
        uint256 id;
        string name;
        string course;
        uint256 age;
        Status status;
    }

    uint256 private uid;
    mapping(address => mapping(uint256 => StudentDetails)) public studentRecords;
    mapping(address => uint256[]) public studentIds;

    mapping(address => EmployeeDetails) public employees;
    address[] public employeeAddresses;


    function register_student(string memory _name, string memory _course, uint256 _age) external {
        uid++;
        StudentDetails memory _student = StudentDetails(uid, _name, _course, _age, Status.ACTIVE);
        studentRecords[msg.sender][uid] = _student;
        studentIds[msg.sender].push(uid);
    }

    function update_student(uint256 _student_id, string memory _new_name) external {
        StudentDetails storage student = studentRecords[msg.sender][_student_id];
        if (student.id == 0) revert STUDENT_NOT_FOUND();
        student.name = _new_name;
    }

    function update_students_status(uint256 _student_id, Status _new_status) external {
        StudentDetails storage student = studentRecords[msg.sender][_student_id];
        if (student.id == 0) revert STUDENT_NOT_FOUND();
        student.status = _new_status;
    }

    function delete_student(uint256 _student_id) external {
        if (studentRecords[msg.sender][_student_id].id == 0) revert STUDENT_NOT_FOUND();
        delete studentRecords[msg.sender][_student_id];

        uint256[] storage ids = studentIds[msg.sender];
        for (uint256 i = 0; i < ids.length; i++) {
            if (ids[i] == _student_id) {
                ids[i] = ids[ids.length - 1];
                ids.pop();
                break;
            }
        }
    }

    function get_student_by_id(uint256 _student_id) external view returns (StudentDetails memory) {
        StudentDetails memory student = studentRecords[msg.sender][_student_id];
        if (student.id == 0) revert STUDENT_NOT_FOUND();
        return student;
    }

    function get_all_students() external view returns (StudentDetails[] memory) {
        uint256[] storage ids = studentIds[msg.sender];
        StudentDetails[] memory result = new StudentDetails[](ids.length);
        for (uint256 i = 0; i < ids.length; i++) {
            result[i] = studentRecords[msg.sender][ids[i]];
        }
        return result;
    }

  
    function register_employee(address _employee, string memory _name, EmployeeRole _role, uint256 _salary) public override {
        if (_employee == address(0)) revert ZERO_ADDRESS();
        if (employees[_employee].isEmployed) revert EMPLOYEE_ALREADY_REGISTERED();
        if (_salary == 0) revert EXCEEDS_SALARY();

        employees[_employee] = EmployeeDetails(_name, _role, _salary, true);
        employeeAddresses.push(_employee);
    }

    function pay_salary(address _employee) public payable override {
        EmployeeDetails storage emp = employees[_employee];
        if (!emp.isEmployed) revert NOT_EMPLOYED();
        if (msg.value == 0 || msg.value > emp.salary) revert EXCEEDS_SALARY();

        (bool sent, ) = _employee.call{value: msg.value}("");
        require(sent, "Payment failed");
    }

    function get_all_employees() external view override returns (EmployeeDetails[] memory) {
        EmployeeDetails[] memory result = new EmployeeDetails[](employeeAddresses.length);
        for (uint256 i = 0; i < employeeAddresses.length; i++) {
            result[i] = employees[employeeAddresses[i]];
        }
        return result;
    }
}
