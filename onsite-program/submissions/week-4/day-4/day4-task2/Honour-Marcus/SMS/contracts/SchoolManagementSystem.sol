// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

contract SchoolManagementSystem {
    error STUDENT_NOT_FOUND();
    error STUDENT_ALREADY_REGISTERED();

    enum Status {
        ACTIVE,
        DEFERRED,
        RUSTICATED
    }

    struct StudentDetails {
        string name;
        string course;
        uint256 age;
        Status status;
    }

   
    mapping(address => StudentDetails) private students;
    address[] private  studentAddresses;
    
    function register_student(address studentAddress, string memory _name, string memory _course, uint256 _age) external {
       if (bytes(students[studentAddress].name).length != 0) {
            revert STUDENT_ALREADY_REGISTERED();
        }
            students[studentAddress] = StudentDetails({
            name: _name,
            course: _course,
            age: _age,
            status: Status.ACTIVE
        });
        studentAddresses.push(studentAddress);
    }

    
    function update_student(
        address studentAddress,
        string memory _new_name
    ) external {
        if (bytes(students[studentAddress].name).length == 0) {
            revert STUDENT_NOT_FOUND();
        }

        students[studentAddress].name = _new_name;
    }

    
    function update_student_status(
        address studentAddress,
        Status _new_status
    ) external {
        if (bytes(students[studentAddress].name).length == 0) {
            revert STUDENT_NOT_FOUND();
        }

        students[studentAddress].status = _new_status;
    }

   
    function delete_student(address studentAddress) external {
        if (bytes(students[studentAddress].name).length == 0) {
            revert STUDENT_NOT_FOUND();
        }

        delete students[studentAddress];
    }

    function get_all_students() external view returns (StudentDetails[] memory) {
    uint256 count = studentAddresses.length;
    StudentDetails[] memory allStudents = new StudentDetails[](count);

    for (uint256 i = 0; i < count; i++) {
        allStudents[i] = students[studentAddresses[i]];
    }

    return allStudents;
}


    
    function get_student(address studentAddress)
        external
        view
        returns (StudentDetails memory)
    {
        if (bytes(students[studentAddress].name).length == 0) {
            revert STUDENT_NOT_FOUND();
        }

        return students[studentAddress];
    }
}
