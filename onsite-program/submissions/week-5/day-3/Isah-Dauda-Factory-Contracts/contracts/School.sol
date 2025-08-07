// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

contract SchoolManagementSystem {
    enum Status {
        ACTIVE,
        DEFERRED,
        RUSTICATED
    }

    struct Student {
        uint id;
        string name;
        uint age;
        string gender;
        Status status;
    }

    mapping(address => Student) private students;
    mapping(address => bool) private isRegistered;

    uint public nextId;

    error NotRegistered();
    error AlreadyRegistered();

    function registerStudent(
        string memory _name,
        uint _age,
        string memory _gender
    ) external {
        if (isRegistered[msg.sender]) revert AlreadyRegistered();

        students[msg.sender] = Student({
            id: nextId,
            name: _name,
            age: _age,
            gender: _gender,
            status: Status.ACTIVE
        });

        isRegistered[msg.sender] = true;
        nextId++;
    }

    function updateStudent(string memory _newName, uint _newAge) external {
        if (!isRegistered[msg.sender]) revert NotRegistered();

        Student storage s = students[msg.sender];
        s.name = _newName;
        s.age = _newAge;
    }

    function updateStatus(Status _newStatus) external {
        if (!isRegistered[msg.sender]) revert NotRegistered();

        students[msg.sender].status = _newStatus;
    }

    function getStudent() external view returns (Student memory) {
        if (!isRegistered[msg.sender]) revert NotRegistered();
        return students[msg.sender];
    }

    function getStatus() external view returns (Status) {
        if (!isRegistered[msg.sender]) revert NotRegistered();
        return students[msg.sender].status;
    }

    function deleteStudent() external {
        if (!isRegistered[msg.sender]) revert NotRegistered();
        delete students[msg.sender];
        isRegistered[msg.sender] = false;
    }
}
