// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

contract SMS {
    enum Status {
        ACTIVE, 
        DEFERRED, 
        RUSTICATED
    }
    struct Student {
        uint256 id; 
        string name; 
        uint256 age; 
        string gender; 
        Status status; 
    }

    Student[] public students;
    uint256 public nextId = 0;

    address public immutable admin = msg.sender;

    modifier onlyAdmin() {
        require(admin == msg.sender, "Not allowed to perform this action"); 
        _; 
    }


    function createStudentInfo(string memory _name, uint256 _age, string memory _gender) external {
        Student memory newStudent = Student({
            id: nextId,
            name: _name,
            age: _age,
            gender: _gender,
            status: Status.ACTIVE
        }); 
        students.push(newStudent);
        nextId++;  
    }

    function updateStudentInfo(uint256 _index, string memory _name, uint _age) external onlyAdmin {
        require(_index < students.length, "Index out of range");
        Student storage updateStudent = students[_index]; 
        updateStudent.name = _name; 
        updateStudent.age = _age; 
    }

    function updateStudentStatus(uint256 _index, Status newStatus) external onlyAdmin returns (Student memory) {
        require(_index < students.length, "Index out of range");
        Student storage student = students[_index]; 
        student.status = newStatus; 
        return student; 

    }

    function deleteStudentInfo(uint256 _index) external onlyAdmin {
        require(_index < students.length, "Index out of range");
        students[_index] = students[students.length - 1]; 
        students.pop(); 
    }

    function getAllStudentInfo() external view returns (Student[] memory) {
        return students; 
    }

    function getSingleStudentInfo(uint256 _index) external view returns (
        uint256, string memory, uint256, string memory, Status
    ) {
        require(_index < students.length, "Index out of range");
        Student memory student = students[_index]; 
        return (student.id, student.name, student.age, student.gender, student.status); 
    }
}
