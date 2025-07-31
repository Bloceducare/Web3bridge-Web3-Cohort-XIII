//SPDX-License-Identifier: MIT

pragma solidity ^0.8.28;


contract SchoolManagement {

    enum Status {
        ACTIVE,
        DEFERRED,
        RUSTICATED
    }

    struct StudentData {
        uint256 id;
        string name;
        uint256 age;
        Status status;
        bool registrationCompleted;
    }

    // state variables

    StudentData[] public students;
    uint256 public studentId = 1;


    function createStudent (string memory _name, uint256 _age) external {
        require(_age > 0 && _age < 50, "INVALID AGE");

        StudentData memory new_student_data_  = StudentData({
            id: studentId,
            name: _name,
            age: _age,
            status: Status.ACTIVE,
            registrationCompleted: true
        });


       students.push(new_student_data_);

       studentId ++;
    }


   function getStudentId(uint256 _id) internal view returns(uint256) {
      
      for (uint256 i = 0; i < students.length; i ++) {
        if( students[i].id == _id) {
            return i;
        }
      }
      revert("Student with this ID does not exist");
   }

  



  function getStudent(uint256 _id) external view  returns(
    uint256 id, 
    string memory name,
    uint256 age,
    Status status,
    bool registrationCompleted
    ) {
        uint256 index = getStudentId(_id);
        StudentData memory student = students[index];


        return  (
            student.id,
            student.name,
            student.age,
            student.status,
            student.registrationCompleted
        );
    }

  
  function getStudents() external view returns(StudentData[] memory) {
    return students;
  }


  function  updateStatus(uint256 _id, Status _new_status) external  {
     uint256 index = getStudentId(_id);
    students[index].status = _new_status;

  }


  function updateStudentData(uint256 _id, string memory _name, uint256 _age ) external {
   
    uint256 index = getStudentId(_id);

    students[index].name = _name;
    students[index].age = _age;

  }


   function deleteStudent(uint256 _id) external {
    uint256 index = getStudentId(_id);
    
    delete students[index];
    

   }
}