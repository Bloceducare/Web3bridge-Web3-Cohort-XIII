// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;


contract SchoolManagementSystem {
    enum Gender{MALE,FEMALE}
    enum Status { ACTIVE, DEFERRED, RUSTICATED }
    struct Student{
        string name;
        uint age;
        Gender gender;
        uint id;
        Status status;
    }
    uint private nextStudentId = 1000;
    error INVALID_ARGS();
    mapping (address=> Student[]) public usersSchool;

    function registerStudent( string memory name,uint age, Gender gender) external {
        require(bytes(name).length>0,"invalid student name");
        require(age> 0,"premature student registration is not allowed");
        uint id = nextStudentId++;
        usersSchool[msg.sender].push(Student(name, age, gender, id,Status.ACTIVE));
    }
    function updateStudentAge(uint age, uint id) external {
        require(age > 0, "Invalid age");
        Student[] storage students = usersSchool[msg.sender];
        for (uint i = 0; i < students.length; i++) {
            if (students[i].id == id) {
                students[i].age = age;
                return;
            }
        }
        revert INVALID_ARGS();
    }

    function updateStudentProfile(string memory name, uint id) public {
        require(bytes(name).length>0,"invalid student name");
        Student[] storage students = usersSchool[msg.sender];
        for (uint count = 0; count < students.length; count++){
            if (students[count].id == id) {
                students[count].name = name;
                return;
            }
        }
        revert INVALID_ARGS();
    }
    function updateStudentProfile(uint age, uint id, string memory name) external{
        this.updateStudentAge(age, id);
        updateStudentProfile(name, id);
    }

    function suspendStudent(uint id) external{
        Student[] storage students = usersSchool[msg.sender];
        for (uint count = 0; count < students.length; count++){
            if(students[count].id == id){
                require(students[count].status == Status.ACTIVE, "Only active students can be suspended");
                students[count].status = Status.DEFERRED;
                return;
            }
        }
        revert INVALID_ARGS();
    }

    function cancelStudentSuspension(uint id) external{
        Student[] storage students = usersSchool[msg.sender];
        for (uint count = 0; count < students.length; count++){
            if(students[count].id == id){
                require(students[count].status == Status.DEFERRED, "Student not suspended");
                students[count].status = Status.ACTIVE;
                return;
            }
        }
        revert INVALID_ARGS();
    }

    function getStudentBy(uint id) external view returns (Student memory){
        Student[] storage students = usersSchool[msg.sender];
        for (uint count = 0; count < students.length; count++){
            if(students[count].id == id){
                return students[count];
            }
        }
        revert INVALID_ARGS();
    }

    function getuserSchool() external view returns (Student[] memory){
        return usersSchool[msg.sender];
    }

    function rusticateStudent(uint id) external {
        Student[] storage students = usersSchool[msg.sender];
        for (uint count = 0; count < students.length; count++){
            if(students[count].id == id){
                require(students[count].status != Status.RUSTICATED, "Already rusticated");
                students[count].status = Status.RUSTICATED;
                return;
            }
        }
        revert INVALID_ARGS();
    }
    function deleteStudent(uint id)external {
        Student[] storage students = usersSchool[msg.sender];
        for (uint count = 0; count < students.length; count++){
            if(students[count].id == id){
                Student memory lastStudent = students[students.length - 1];
                students[count] = lastStudent;
                students.pop();
                return;
            }
        }
        revert("Student with id not found");
    }
}