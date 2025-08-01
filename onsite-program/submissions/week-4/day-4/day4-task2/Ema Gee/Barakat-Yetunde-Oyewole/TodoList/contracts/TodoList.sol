// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract TodoList {
    error InvalidTodoIndex(string reason);
    error EmptyTodoTitle(string reason);
    error EmptyTodoDescription(string reason);
    error TodoNotFound(string reason);
    error TodoAlreadyExists(string reason);
    error UnauthorizedAccess(string reason);

    enum Status {
        Pending,
        Completed
    }

    struct Todo {
        string title;
        string description;
        Status status;
        address creator;
    }

    mapping(address => Todo) private todoMap;
    address[] private todoAddresses;

    modifier todoExists(address _addr) {
        if (bytes(todoMap[_addr].title).length == 0) {
            revert TodoNotFound("Todo not found");
        }
        _;
    }

    modifier todoDoesNotExist(address _addr) {
        if (bytes(todoMap[_addr].title).length != 0) {
            revert TodoAlreadyExists("Todo already exists");
        }
        _;
    }

    modifier onlyCreator(address _addr) {
        if (todoMap[_addr].creator != msg.sender) {
            revert UnauthorizedAccess("Only creator can modify this todo");
        }
        _;
    }

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

        todoMap[_addr] = Todo({
            title: _taskTitle,
            description: _taskDesc,
            status: Status.Pending,
            creator: msg.sender
        });

        todoAddresses.push(_addr);
    }

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

    function getTodos() external view returns (Todo[] memory) {
        Todo[] memory todos = new Todo[](todoAddresses.length);
        for (uint256 i = 0; i < todoAddresses.length; i++) {
            todos[i] = todoMap[todoAddresses[i]];
        }
        return todos;
    }

    function deleteTodo(
        address _addr
    ) external todoExists(_addr) onlyCreator(_addr) {
        delete todoMap[_addr];

        for (uint256 i = 0; i < todoAddresses.length; i++) {
            if (todoAddresses[i] == _addr) {
                todoAddresses[i] = todoAddresses[todoAddresses.length - 1];
                todoAddresses.pop();
                break;
            }
        }
    }

    function getTodo(
        address _addr
    ) external view todoExists(_addr) returns (Todo memory) {
        return todoMap[_addr];
    }
}
