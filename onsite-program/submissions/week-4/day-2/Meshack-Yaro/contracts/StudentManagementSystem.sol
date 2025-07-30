// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

contract StudentManagementSystem {
    struct Student {
        string name;
        uint256 id;
        uint8 age;
        Gender gender;
        Status status;
    }
    enum Gender {
        MALE, FEMALE
    }
    enum Status {
        ACTIVE, DEFERRED, RUSTICATED
    }

    Student[] public students;
    uint256 public id;

    function register_student(string memory _name, uint256 _id, uint8 _age, Gender _gender) external {
        Student memory new_student_ = Student({name: _name, id: _id, age: _age, gender: _gender, status: Status.ACTIVE});
        students.push(new_student_);
        nextId++;
    }

    function update_student_data(string memory _new_name, uint8 _new_age, Gender _new_gender, Status _new_status, uint _index) external {
        require(_index <= students.length-1, "Invalid ID");
        students[_index].name = _new_name;
        students[_index].age = _new_age;
        students[_index].gender = _new_gender;
        students[_index].status = _new_status;
    }

    function view_all_students() external view returns(Student[] memory) {
        return students;
    }

    function delete_student_details(uint256 _index) external {
        require(_index <= students.length, "student not found");
        students[_index] = students[students.length-1];
        students.pop();
    }

    uint256 public nextId;

}