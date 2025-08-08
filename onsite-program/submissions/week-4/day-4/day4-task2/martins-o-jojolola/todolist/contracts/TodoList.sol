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

    modifier todoExists(address _todoAddress) {
        if (bytes(todoMap[_todoAddress].title).length == 0) {
            revert TodoNotFound("Todo not found");
        }
        _;
    }

    modifier todoDoesNotExist(address _todoAddress) {
        if (bytes(todoMap[_todoAddress].title).length != 0) {
            revert TodoAlreadyExists("Todo already exists");
        }
        _;
    }

    modifier onlyCreator(address _todoAddress) {
        if (todoMap[_todoAddress].creator != msg.sender) {
            revert UnauthorizedAccess("Only creator can modify this todo");
        }
        _;
    }

    function createTodo(
        address _todoAddress,
        string memory _title,
        string memory _description
    ) external todoDoesNotExist(_todoAddress) {
        if (bytes(_title).length == 0) {
            revert EmptyTodoTitle("Todo title cannot be empty");
        }
        if (bytes(_description).length == 0) {
            revert EmptyTodoDescription("Todo description cannot be empty");
        }

        todoMap[_todoAddress] = Todo({
            title: _title,
            description: _description,
            status: Status.Pending,
            creator: msg.sender
        });

        todoAddresses.push(_todoAddress);
    }

    function updateTodo(
        address _todoAddress,
        string memory _newTitle,
        string memory _newDescription
    ) external todoExists(_todoAddress) onlyCreator(_todoAddress) {
        if (bytes(_newTitle).length == 0) {
            revert EmptyTodoTitle("Todo title cannot be empty");
        }
        if (bytes(_newDescription).length == 0) {
            revert EmptyTodoDescription("Todo description cannot be empty");
        }

        Todo storage todo = todoMap[_todoAddress];
        todo.title = _newTitle;
        todo.description = _newDescription;
    }

    function toggleTodoStatus(
        address _todoAddress
    ) external todoExists(_todoAddress) onlyCreator(_todoAddress) {
        Todo storage todo = todoMap[_todoAddress];
        if (todo.status == Status.Pending) {
            todo.status = Status.Completed;
        } else {
            todo.status = Status.Pending;
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
        address _todoAddress
    ) external todoExists(_todoAddress) onlyCreator(_todoAddress) {
        delete todoMap[_todoAddress];

        for (uint256 i = 0; i < todoAddresses.length; i++) {
            if (todoAddresses[i] == _todoAddress) {
                todoAddresses[i] = todoAddresses[todoAddresses.length - 1];
                todoAddresses.pop();
                break;
            }
        }
    }

    function getTodo(
        address _todoAddress
    ) external view todoExists(_todoAddress) returns (Todo memory) {
        return todoMap[_todoAddress];
    }
}
