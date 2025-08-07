// A smart contract for a todo-list

// SPDX-License-Identifier: MIT

pragma solidity ^0.8.28;

contract TodoList {
    enum Status {
        PENDING,
        COMPLETED,
        CANCELLED
    }

    struct Todo {
        string title;
        string description;
        Status status;
    }

    mapping(address => Todo[]) public todos;

    function addTodo(
        string memory _title,
        string memory _description,
        Status _status
    ) external {
        Todo memory newTodo = Todo(_title, _description, _status);
        todos[msg.sender].push(newTodo);
    }

    function updateTodos(
        uint256 _index,
        string memory _title,
        string memory description,
        Status _status
    ) external {
        todos[msg.sender][_index] = Todo(_title, description, _status);
    }

    function getTodo(
        uint256 _index
    ) external view returns (string memory, string memory, string memory) {
        require(_index > todos[msg.sender].length, "Out of bounds.");
        string memory currentStatus;
        if (todos[msg.sender][_index].status == Status.PENDING) {
            currentStatus = "Pending";
        } else if (todos[msg.sender][_index].status == Status.COMPLETED) {
            currentStatus = "Completed";
        } else {
            currentStatus = "Cancelled";
        }
        return (
            (
                todos[msg.sender][_index].title,
                todos[msg.sender][_index].description,
                currentStatus
            )
        );
    }
}
