// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

contract SchoolManagementSystem {
    error STUDENT_NOT_FOUND(string reason);
    error INVALID_INPUT(string reason);
    error STUDENT_ALREADY_EXISTS(string reason);
    error UNAUTHORIZED_ACCESS(string reason);

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
        address creator;
    }

    mapping(address => StudentDetails) private studentMap;
    address[] private studentAddresses;

    modifier studentExists(address _studentAddress) {
        if (bytes(studentMap[_studentAddress].name).length == 0) {
            revert STUDENT_NOT_FOUND("Student not found");
        }
        _;
    }

    modifier studentDoesNotExist(address _studentAddress) {
        if (bytes(studentMap[_studentAddress].name).length != 0) {
            revert STUDENT_ALREADY_EXISTS("Student already exists");
        }
        _;
    }

    modifier onlyCreator(address _studentAddress) {
        if (studentMap[_studentAddress].creator != msg.sender) {
            revert UNAUTHORIZED_ACCESS(
                "Only creator can modify or delete student"
            );
        }
        _;
    }

    function register_student(
        address _studentAddress,
        string memory _name,
        string memory _course,
        uint256 _age
    ) external studentDoesNotExist(_studentAddress) {
        if (bytes(_name).length == 0)
            revert INVALID_INPUT("Name cannot be empty");
        if (bytes(_course).length == 0)
            revert INVALID_INPUT("Course cannot be empty");
        if (_age == 0) revert INVALID_INPUT("Age must be greater than zero");

        studentMap[_studentAddress] = StudentDetails({
            name: _name,
            course: _course,
            age: _age,
            status: Status.ACTIVE,
            creator: msg.sender
        });

        studentAddresses.push(_studentAddress);
    }

    function update_student(
        address _studentAddress,
        string memory _newName
    ) external studentExists(_studentAddress) onlyCreator(_studentAddress) {
        if (bytes(_newName).length == 0)
            revert INVALID_INPUT("New name cannot be empty");

        studentMap[_studentAddress].name = _newName;
    }

    function update_student_status(
        address _studentAddress,
        Status _newStatus
    ) external studentExists(_studentAddress) onlyCreator(_studentAddress) {
        studentMap[_studentAddress].status = _newStatus;
    }

    function get_student_by_address(
        address _studentAddress
    )
        external
        view
        studentExists(_studentAddress)
        returns (StudentDetails memory)
    {
        return studentMap[_studentAddress];
    }

    function delete_student(
        address _studentAddress
    ) external studentExists(_studentAddress) onlyCreator(_studentAddress) {
        delete studentMap[_studentAddress];

        for (uint256 i = 0; i < studentAddresses.length; i++) {
            if (studentAddresses[i] == _studentAddress) {
                studentAddresses[i] = studentAddresses[
                    studentAddresses.length - 1
                ];
                studentAddresses.pop();
                break;
            }
        }
    }

    function get_all_students()
        external
        view
        returns (StudentDetails[] memory)
    {
        StudentDetails[] memory students = new StudentDetails[](
            studentAddresses.length
        );
        for (uint256 i = 0; i < studentAddresses.length; i++) {
            students[i] = studentMap[studentAddresses[i]];
        }
        return students;
    }

    function get_all_student_addresses()
        external
        view
        returns (address[] memory)
    {
        return studentAddresses;
    }
}
