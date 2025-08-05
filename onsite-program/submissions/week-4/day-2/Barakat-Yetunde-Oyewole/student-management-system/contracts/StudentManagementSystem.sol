// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

// Define the contract
contract StudentManagementSystem {
    struct Student_info {           // Define a struct to hold each student's information
        string name;
        uint age;
        string course;
        uint yearOfStudy;
        Student_Status status;   // Enum to represent student status
    }

    enum Student_Status { Active, Deferred, Rusticated, Graduated }     // Enum to represent the possible statuses of a student

    Student_info[] public students;     // Dynamic array to store all students

    // Function to register a new student
    function student_register(
        string memory _name,
        uint _age,
        string memory _course,
        uint _yearOfStudy
    ) external {
        Student_info memory newStudent = Student_info({   // Create a new student struct and add it to the array
            name: _name,
            age: _age,
            course: _course,
            yearOfStudy: _yearOfStudy,
            status: Student_Status.Active       // Default status
        });
        students.push(newStudent);              // Add to the students array
    }


    function update_student_info(               //Updates student info based on the index in the array
        uint _index,                            //Index of the student in the array
        string memory _name,                    //New name of the student   
        uint _age,                              //New age of the student
        string memory _course,                  //New course of the student
        uint _yearOfStudy                       //New year of study of the student
    ) external {
        require(_index <= students.length, "Student does not exist");           // Index must be valid
        
        Student_info storage student = students[_index];        // Get the student and update the fields
        student.name = _name;
        student.age = _age;
        student.course = _course;
        student.yearOfStudy = _yearOfStudy;
    }

    function delete_student(uint _index) external {     //Deletes a student by index //_index Index of the student
        require(_index <= students.length, "Student does not exist");   // Check valid index
        
        delete students[_index]; // Deletes the student info
    }   

    function update_student_status(         //Updates the status of a student
        uint _index, //index of the student
        Student_Status _status      //new status of the student
    ) external {
        require(_index <= students.length, "Student does not exist");       // Check valid index
        
        students[_index].status = _status;      // Update status
    }

    function get_student_info(uint _index) external view returns (      //Retrieves the information of a single student //Index of the student
        Student_info memory    //Full student information as a struct
    ) {
        require(_index <= students.length, "Student does not exist");  // Check valid index
        
        return students[_index];        // Return the student info
    }

    function get_all_students() external view returns (Student_info[] memory) {    //Returns all students in the system
        return students;        // Return the entire array of students
    }
}


//for (uint256 i = 0; i < students.length; i++) {    // Loop through all students
            //if (students[i].status == Student_Status.Active) {   // Check if the student is active 
                //students[1].name = "Updated Name";  // Example of updating a student's name
            //}
        //}
        //return student[i];      // Return the count of active students
    //}
//}