// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract TodoList {
    struct TodoItem {
        uint256 todoId;
        string todoTitle;
        string todoDescription;
        bool isCompleted;
    }

    uint256 private nextTodoId;
    mapping(uint256 => TodoItem) public todos;
    uint256[] public todoIdList;

    function createTodo(string memory _todoTitle, string memory _todoDescription) external {
        nextTodoId++;
        todos[nextTodoId] = TodoItem(nextTodoId, _todoTitle, _todoDescription, false);
        todoIdList.push(nextTodoId);
    }

    function updateTodo(uint256 _todoId, string memory _newTitle, string memory _newDescription) external {
        require(todos[_todoId].todoId != 0, "TODO_NOT_FOUND");
        todos[_todoId].todoTitle = _newTitle;
        todos[_todoId].todoDescription = _newDescription;
    }

    function toggleTodoStatus(uint256 _todoId) external {
        require(todos[_todoId].todoId != 0, "TODO_NOT_FOUND");
        todos[_todoId].isCompleted = !todos[_todoId].isCompleted;
    }

    function getAllTodos() external view returns (TodoItem[] memory) {
        uint256 count = todoIdList.length;
        TodoItem[] memory result = new TodoItem[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = todos[todoIdList[i]];
        }
        return result;
    }

    function deleteTodo(uint256 _todoId) external {
        require(todos[_todoId].todoId != 0, "TODO_NOT_FOUND");
        delete todos[_todoId];
        for (uint256 i = 0; i < todoIdList.length; i++) {
            if (todoIdList[i] == _todoId) {
                todoIdList[i] = todoIdList[todoIdList.length - 1];
                todoIdList.pop();
                return;
            }
        }
    }
}
