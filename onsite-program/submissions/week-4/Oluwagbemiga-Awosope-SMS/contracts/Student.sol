// Everything the School Management System would be all about comes here.

/*
enum StudentClass {
    JS1,
    JS2,
    JS3,
    SS1,
    SS2,
    SS3
}
*/

enum Hobby { // pick just one
    PlayingFootball,
    Movies,
    Exercising,
    Reading,
    Singing,
    Dancing
}

enum Gender {
    Male, Female
}

enum StudentStatus {
    ACTIVE,
    DEFERRED,
    RUSTICATED
}

struct Student {
    string name;
    uint age;
    uint256 unique_id;
    Gender gender;
    StudentStatus student_status;
    Hobby hobby;
}

contract SchoolManagement {
    Student[] public school_students;

    function registerStudent(string memory new_name, uint new_age, uint new_id_index, Gender new_gender, StudentStatus new_status, Hobby new_hobby) public {
        
        new_student = ({
            name: new_name,
            age: new_age,
            unique_id: generateUniqueId(Student, school_student[school_student.length - new_id_index]),
            gender: new_gender,
            student_status: new_status,
            hobby: new_hobby
        })

        school_students.push(new_student);
    };

    function updateStudent(uint index, Student studentData) public { // pass in the Student Struct data during the function call.
        require(index < school_students.length, "Invalid Index!");
        school_students[index].name = studentData.name;
        school_students[index].age = studentData.age;
        school_students[index].gender = studentData.gender;
        // student status and hobby should be set separately (different function call)
    }

    function deleteStudent(unit index) public {
        require(school_students[index] in school_students, "Student data not present in the database");
        delete school_students[index];
    }

    function listAllStudents() view public {
        if (school_students.length <= 0) {
            return "No student in the database" // could return an empty array.
        } else {
            return school_students;
        }
    }

    function getStudentById(uint index) {
        require(school_students[index] in school_students, "Student not found");
        return school_student[index]; // return the full object if the student exists.
    };

    // dynamic functions based on specific use cases
    function updateStudentStatus(uint index, Student studentData) public {
        require(school_students[index] in school_students, "Student not found");
        school_student[index].studentStatus = studentData.student_status; 
    }

    function updateStudentHobby(uint index, Student studentData) public {
        require(school_students[index] in school_students, "Student not found"); // or student does not exist to perform this functionality
        school_student[index].hobby = studentData.hobby;
    }
}

function generateUniqueId(uint totalNoOfStudents, uint index) pure returns (uint) {

     /* 
            * how do return values work?

            * take in current student index, and the total number of student - Then divide the total number of students by the index of that actual student that's being created.
    
            * used when new student is to be registered (for this context  -- simplicity)
    */
    if (index == 0) {
        return 1;
    }

    return totalNoOfStudents.length / index; 
}