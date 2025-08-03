// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract TodoList {
    // Custom error types for more descriptive error handling
    error InvalidTodoIndex(string reason);
    error EmptyTodoTitle(string reason);
    error EmptyTodoDescription(string reason);
    error TodoNotFound(string reason);
    error TodoAlreadyExists(string reason);
    error UnauthorizedAccess(string reason);

    // Enum to represent the status of a todo item
    enum Status {
        Pending,
        Completed
    }

    // Struct to store the details of a todo item
    struct Todo {
        string title;
        string description;
        Status status;
        address creator;
    }

    // Mapping to store each user's todo using their address
    mapping(address => Todo) private todoMap;

    // Array to keep track of all todo addresses for retrieval
    address[] private todoAddresses;

    // Modifier to ensure a todo exists for the given address
    modifier todoExists(address _addr) {
        if (bytes(todoMap[_addr].title).length == 0) {
            revert TodoNotFound("Todo not found");
        }
        _;
    }

    // Modifier to ensure a todo does not already exist for the given address
    modifier todoDoesNotExist(address _addr) {
        if (bytes(todoMap[_addr].title).length != 0) {
            revert TodoAlreadyExists("Todo already exists");
        }
        _;
    }

    // Modifier to restrict function access to the creator of the todo
    modifier onlyCreator(address _addr) {
        if (todoMap[_addr].creator != msg.sender) {
            revert UnauthorizedAccess("Only creator can modify this todo");
        }
        _;
    }

    // Function to create a new todo
    function createTodo(
        address _addr,
        string memory _taskTitle,
        string memory _taskDesc
    ) external todoDoesNotExist(_addr) {
        if (bytes(_taskTitle).length == 0) {
            revert EmptyTodoTitle("Todo title cannot be empty");
        }
        if (bytes(_taskDesc).length == 0) {
            revert EmptyTodoDescription("Todo description cannot be empty");
        }

        // Create and store the new todo
        todoMap[_addr] = Todo({
            title: _taskTitle,
            description: _taskDesc,
            status: Status.Pending,
            creator: msg.sender
        });

        // Add the address to the tracking array
        todoAddresses.push(_addr);
    }

    // Function to update an existing todo's title and description
    function updateTodo(
        address _addr,
        string memory _newTitle,
        string memory _newDesc
    ) external todoExists(_addr) onlyCreator(_addr) {
        if (bytes(_newTitle).length == 0) {
            revert EmptyTodoTitle("Todo title cannot be empty");
        }
        if (bytes(_newDesc).length == 0) {
            revert EmptyTodoDescription("Todo description cannot be empty");
        }

        Todo storage todoItem = todoMap[_addr];
        todoItem.title = _newTitle;
        todoItem.description = _newDesc;
    }

    // Function to toggle a todo's status between Pending and Completed
    function toggleTodoStatus(
        address _addr
    ) external todoExists(_addr) onlyCreator(_addr) {
        Todo storage todoItem = todoMap[_addr];
        if (todoItem.status == Status.Pending) {
            todoItem.status = Status.Completed;
        } else {
            todoItem.status = Status.Pending;
        }
    }

    // Function to retrieve all todos
    function getTodos() external view returns (Todo[] memory) {
        Todo[] memory todos = new Todo[](todoAddresses.length);
        for (uint256 i = 0; i < todoAddresses.length; i++) {
            todos[i] = todoMap[todoAddresses[i]];
        }
        return todos;
    }

    // Function to delete a specific todo
    function deleteTodo(
        address _addr
    ) external todoExists(_addr) onlyCreator(_addr) {
        delete todoMap[_addr];

        // Remove the address from the tracking array
        for (uint256 i = 0; i < todoAddresses.length; i++) {
            if (todoAddresses[i] == _addr) {
                todoAddresses[i] = todoAddresses[todoAddresses.length - 1];
                todoAddresses.pop();
                break;
            }
        }
    }

    // Function to retrieve a specific todo
    function getTodo(
        address _addr
    ) external view todoExists(_addr) returns (Todo memory) {
        return todoMap[_addr];
    }
}
