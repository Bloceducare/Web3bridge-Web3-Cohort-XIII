// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract SchoolManagementSystem {
    
    enum Status { 
        ACTIVE, 
        DEFERRED, 
        RUSTICATED 
    }
    
    struct Student {
        uint256 id;
        string name;
        uint256 age;
        Status status;
        bool exists; 
    }
    
    mapping(address => Student) public students;
    mapping(uint256 => address) public idToAddress;
    
    uint256 public nextId = 1;
    uint256 public totalActiveStudents = 0;
   
    function registerStudent(string memory _name, uint256 _age) public returns (uint256) {
        require(!students[msg.sender].exists, "Student already registered for this address");
        
        Student memory newStudent = Student({
            id: nextId,
            name: _name,
            age: _age,
            status: Status.ACTIVE,
            exists: true
        });
        
        students[msg.sender] = newStudent;
        idToAddress[nextId] = msg.sender;
        
        uint256 currentId = nextId;
        nextId++;
        totalActiveStudents++;
        
        return currentId;
    }
    
    function updateStudent(uint256 _studentId, string memory _newName, uint256 _newAge) public {
        require(students[msg.sender].exists, "Student not found or does not exist");
        require(students[msg.sender].id == _studentId, "Invalid student ID for this address");
        
        students[msg.sender].name = _newName;
        students[msg.sender].age = _newAge;
    }
    
    function deleteStudent(uint256 _studentId) public {
        require(students[msg.sender].exists, "Student not found or does not exist");
        require(students[msg.sender].id == _studentId, "Invalid student ID for this address");
        
        students[msg.sender].exists = false;
        totalActiveStudents--;
    }
    
    function changeStudentStatus(uint256 _studentId, Status _newStatus) public {
        require(students[msg.sender].exists, "Student not found or does not exist");
        require(students[msg.sender].id == _studentId, "Invalid student ID for this address");
        
        students[msg.sender].status = _newStatus;
    }
    
    function getStudent(uint256 _studentId) public view returns (uint256, string memory, uint256, Status, bool) {
        address studentAddress = idToAddress[_studentId];
        Student memory student = students[studentAddress];
        
        if (student.exists && student.id == _studentId) {
            return (student.id, student.name, student.age, student.status, true);
        }
        
        return (0, "", 0, Status.ACTIVE, false);
    }
    
    function studentExists(uint256 _studentId) public view returns (bool) {
        address studentAddress = idToAddress[_studentId];
        return students[studentAddress].exists && students[studentAddress].id == _studentId;
    }
    
    function getTotalActiveStudents() public view returns (uint256) {
        return totalActiveStudents;
    }
}



contract TodoList {
    struct Todo {
        string title;
        string description;
        bool status;
    }

    mapping(address => Todo[]) public todos;

    function create_Todo(string memory _title, string memory _description) public {
        Todo memory new_todo = Todo({
            title: _title,
            description: _description,
            status: false
        });
        todos[msg.sender].push(new_todo);
    }

    function update_Todo(uint256 _index, string memory _title, string memory _new_description) external {
        require(_index < todos[msg.sender].length, "Invalid index");
        todos[msg.sender][_index].title = _title;
        todos[msg.sender][_index].description = _new_description;
    }

    function toggle_todo_status(uint256 _index) external {
        require(_index < todos[msg.sender].length, "Invalid index");
        todos[msg.sender][_index].status = !todos[msg.sender][_index].status;
    }

    function get_todos() external view returns (Todo[] memory) {
        return todos[msg.sender];
    }

    function delete_todos(uint256 _index) external {
        require(_index < todos[msg.sender].length, "Invalid index");
        delete todos[msg.sender][_index];
    }
}