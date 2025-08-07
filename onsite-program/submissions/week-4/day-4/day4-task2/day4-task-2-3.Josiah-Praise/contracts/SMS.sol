// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

/**
 * @title SchoolManagementSystem
 * @notice A system to manage student records using the student's address as the unique ID.
 * @dev This version is simpler and more direct by leveraging addresses as primary keys.
 */
contract SchoolManagementSystem {
    mapping(address => Student) public s_students;

    address[] private s_allStudentAddresses;
    address manager;

    constructor(){
        manager = msg.sender;
    }

    enum Status {
        ACTIVE,
        DEFERRED,
        RUSTICATED
    }

    enum Sex {
        MALE,
        FEMALE,
        OTHER
    }

    struct Student {
        string name;
        string telephone_number;
        uint8 age;
        Sex sex;
        Status status;
        bool exists; // Crucial for checking if an address is a registered student.
    }

    error School__NotFound();
    error School__UnAuthorized();
    error School__StudentAlreadyExists();

    event StudentRegistered(address indexed studentAddress, string name);
    event StudentStatusChanged(address indexed studentAddress, Status newStatus);
    event StudentUpdated(address indexed studentAddress);
    event StudentDeleted(address indexed studentAddress);

    modifier onlyManager{
        if (msg.sender != manager)
            revert School__UnAuthorized();
        _;
    }

    /**
     * @notice Registers a new student in the system using their wallet address.
     * @param _studentAddress The unique wallet address of the student.
     */
    function registerStudent(
        address _studentAddress,
        string calldata _name,
        string calldata _telephone_number,
        uint8 _age,
        Sex _sex
    ) external onlyManager{
        if (s_students[_studentAddress].exists) {
            revert School__StudentAlreadyExists();
        }

        s_students[_studentAddress] = Student({
            name: _name,
            telephone_number: _telephone_number,
            age: _age,
            sex: _sex,
            status: Status.ACTIVE,
            exists: true
        });

        s_allStudentAddresses.push(_studentAddress);
        
        emit StudentRegistered(_studentAddress, _name);
    }

    /**
     * @notice Changes the status of an existing student.
     */
    function changeStudentStatus(address _studentAddress, Status _status) external onlyManager {
        if (!s_students[_studentAddress].exists) {
            revert School__NotFound();
        }
        s_students[_studentAddress].status = _status;
        emit StudentStatusChanged(_studentAddress, _status);
    }

    /**
     * @notice Updates the details of an existing student.
     */
    function updateStudent(
        address _studentAddress,
        string calldata _name,
        string calldata _telephone_number,
        uint8 _age,
        Sex _sex
    ) external onlyManager{
        if (!s_students[_studentAddress].exists) {
            revert School__NotFound();
        }

        Student storage student = s_students[_studentAddress];
        student.name = _name;
        student.telephone_number = _telephone_number;
        student.age = _age;
        student.sex = _sex;
        
        emit StudentUpdated(_studentAddress);
    }

    /**
     * @notice Soft-deletes a student by marking their record as not existing.
     */
    function deleteStudent(address _studentAddress) external onlyManager{
        if (!s_students[_studentAddress].exists) {
            revert School__NotFound();
        }
        s_students[_studentAddress].exists = false;

        emit StudentDeleted(_studentAddress);
    }

    /**
     * @notice Gets all details of a single student by their address.
     * @dev The public `s_students` mapping provides a free getter, but this has a custom error.
     */
    function getStudent(address _studentAddress) external view returns (Student memory) {
        if (!s_students[_studentAddress].exists) {
            revert School__NotFound();
        }
        return s_students[_studentAddress];
    }

    /**
     * @notice Returns a list of all students ever registered.
     */
    function getAllStudents() external view returns (Student[] memory) {
        uint256 studentCount = s_allStudentAddresses.length;
        Student[] memory allStudents = new Student[](studentCount);

        for (uint256 i = 0; i < studentCount; i++) {
            address studentAddress = s_allStudentAddresses[i];
            allStudents[i] = s_students[studentAddress];
        }

        return allStudents;
    }

    /**
     * @notice Returns a list of students who are currently active and not deleted.
     */
    function getAllActiveStudents() external view returns (Student[] memory) {
        uint256 activeCount = 0;
        for (uint256 i = 0; i < s_allStudentAddresses.length; i++) {
            address studentAddress = s_allStudentAddresses[i];
            if (s_students[studentAddress].exists && s_students[studentAddress].status == Status.ACTIVE) {
                activeCount++;
            }
        }

        Student[] memory activeStudents = new Student[](activeCount);
        uint256 currentIndex = 0;
        for (uint256 i = 0; i < s_allStudentAddresses.length; i++) {
            address studentAddress = s_allStudentAddresses[i];
            if (s_students[studentAddress].exists && s_students[studentAddress].status == Status.ACTIVE) {
                activeStudents[currentIndex] = s_students[studentAddress];
                currentIndex++;
            }
        }

        return activeStudents;
    }
    
    /**
     * @notice for the factory contract to ping after deployment    
     */
    function ping(string calldata anyString)external pure returns(string memory){
        return anyString;
    }
}