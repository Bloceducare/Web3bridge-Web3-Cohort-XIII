// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SchoolManagementSystem {
    error STUDENT_NOT_FOUND();
    error INVALID_ID();
    error STUDENT_ALREADY_EXISTS();
    
    enum Status {
        ACTIVE,
        DEFERRED,
        RUSTICATED
    }
    
    struct StudentDetails {
        uint256 id;
        string name;
        string course;
        uint256 age;
        Status status;
        address addres;
    }
    
    uint256 private uid;
    
    // Mappings to track students by wallet address
    mapping(address => StudentDetails) public studentsByAddress;
    mapping(address => bool) public isStudentRegistered;
    mapping(uint256 => address) public studentIdToAddress;
    
    address[] public allStudentAddress;
    
    function register_student(string memory _name, string memory _course, uint256 _age) external {
        require(!isStudentRegistered[msg.sender], "Student already registered");
        
        uid = uid + 1;
        
        StudentDetails memory student = StudentDetails(
            uid,
            _name,
            _course,
            _age,
            Status.ACTIVE,
            msg.sender
        );
        
        studentsByAddress[msg.sender] = student;
        isStudentRegistered[msg.sender] = true;
        studentIdToAddress[uid] = msg.sender;
        allStudentAddress.push(msg.sender);
    }
    
    function update_student(string memory _new_name) external {
        require(isStudentRegistered[msg.sender], "Student not found");
        studentsByAddress[msg.sender].name = _new_name;
    }
    
    function get_student_by_address(address _address) external view returns (StudentDetails memory) {
        require(isStudentRegistered[_address], "Student not found");
        return studentsByAddress[_address];
    }
    
    function get_my_details() external view returns (StudentDetails memory) {
        require(isStudentRegistered[msg.sender], "Student not found");
        return studentsByAddress[msg.sender];
    }
    
    function update_student_status(address _address, Status _new_status) external {
        require(isStudentRegistered[_address], "Student not found");
        studentsByAddress[_address].status = _new_status;
    }
    
    function delete_student(address _address) external {
        require(isStudentRegistered[_address], "Student not found");
        
        uint256 studentId = studentsByAddress[_address].id;
        
        delete studentsByAddress[_address];
        delete isStudentRegistered[_address];
        delete studentIdToAddress[studentId];
        
        // Remove from wallet array
        for (uint256 i; i < allStudentAddress.length; i++) {
            if (allStudentAddress[i] == _address) {
                allStudentAddress[i] = allStudentAddress[allStudentAddress.length - 1];
                allStudentAddress.pop();
                break;
            }
        }
    }
    
    function get_all_students() external view returns (StudentDetails[] memory) {
        StudentDetails[] memory students = new StudentDetails[](allStudentAddress.length);
        
        for (uint256 i; i < allStudentAddress.length; i++) {
            students[i] = studentsByAddress[allStudentAddress[i]];
        }
        
        return students;
    }
    
    function get_total_students() external view returns (uint256) {
        return allStudentAddress.length;
    }
}