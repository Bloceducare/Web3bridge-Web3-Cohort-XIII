// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract StudentManagementSystem {

     struct Student {
        string name;
        string email;
        uint age;
        Status status;
        Gender gender;
        Level level;
    }

    enum Status {
        ACTIVE,
        DEFERRED,
        RUSTICATED
    }

    enum Gender {
        MALE,
        FEMALE
    }
    
    enum Level {
        SS1,
        SS2,
        SS3
    }

    Student [] public students;

    event StudentCreated(uint indexed studentId, string name, string email, uint age, Status status, Gender gender, Level level);
    event StudentUpdated(uint indexed studentId, string name, string email, uint age);
    event StudentStatusUpdated(uint indexed studentId, Status newStatus);
    event StudentGenderUpdated(uint indexed studentId, Gender newGender);
    event StudentLevelUpdated(uint indexed studentId, Level newLevel);
    event StudentDeleted(uint indexed studentId);

    function create_student(
        string memory _name, 
        string memory _email, 
        uint _age,
        Status _status,
        Gender _gender,
        Level _level
        ) external {

        Student memory new_student_ = Student({
            name: _name, 
            email: _email,
            age: _age,
            status: _status,
            gender: _gender,
            level: _level
        });

        students.push(new_student_);
        uint studentId = students.length -1;

        emit StudentCreated(studentId, _name, _email, _age, _status, _gender, _level);
    }


        function update_student(
            uint256 _index, 
            string memory _new_name, 
            string memory _new_email, 
            uint _new_age
            ) external 
    {
        require(_index <= students.length, "Invalid index");

        students[_index].name = _new_name;
        students[_index].email = _new_email;
        students[_index].age =  _new_age;

        emit StudentUpdated(_index, _new_name, _new_email, _new_age);
    }

    function update_student_status(uint256 _index, Status _new_status) external {
        require(_index < students.length, "Invalid index");

        students[_index].status = _new_status;
        emit StudentStatusUpdated(_index, _new_status);
    }

    function update_student_gender(uint256 _index, Gender _new_gender) external {
        require(_index < students.length, "Invalid index");

        students[_index].gender = _new_gender;
        emit StudentGenderUpdated(_index, _new_gender);
    }

    function upfate_student_level(uint256 _index, Level _new_level) external {
        require(_index < students.length, "Invalid index");

        students[_index].level = _new_level;
        emit StudentLevelUpdated(_index, _new_level);
    }

    function get_students() external view returns (Student[] memory) {
        return students;
    }

    function delete_student(uint _index) external {
        require(_index <= students.length, "Invalid index");

        students[_index] = students[students.length -1]; // Pushes the student to the last on the list
        students.pop(); // Deletes the last student...

        emit StudentDeleted(_index);
    }



}
