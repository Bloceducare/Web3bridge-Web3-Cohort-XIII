// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

/**
 * @title TodoList
 * @author Your Name
 * @notice A gas-efficient Todo List application using a mapping for fast lookups.
 * @dev Implements full CRUD (Create, Read, Update, Delete) functionality for todos with titles.
 */
contract TodoList {

    mapping(uint256 => Todo) private s_todos;
    uint256[] private s_allTodoIds;
    uint256 private s_nextTodoId = 1;


    enum Status {
        PENDING,
        COMPLETED
    }

    struct Todo {
        uint256 id;
        string title;
        string text;
        Status status;
        bool exists;
    }

    error TodoList__NotFound();

    event TodoCreated(uint256 indexed todoId, string title, string text);
    event TodoStatusChanged(uint256 indexed todoId, Status newStatus);
    event TodoTitleUpdated(uint256 indexed todoId);
    event TodoTextUpdated(uint256 indexed todoId);
    event TodoDeleted(uint256 indexed todoId);

    /**
     * @notice Creates a new Todo item with a title and text.
     * @param _title The title of the todo item.
     * @param _text The detailed content of the todo item.
     * @return newTodoId The unique ID of the newly created todo.
     */
    function createTodo(string calldata _title, string calldata _text) external returns (uint256) {
        uint256 newTodoId = s_nextTodoId;

        s_todos[newTodoId] = Todo({
            id: newTodoId,
            title: _title,
            text: _text,
            status: Status.PENDING,
            exists: true
        });

        s_allTodoIds.push(newTodoId);
        s_nextTodoId++;

        emit TodoCreated(newTodoId, _title, _text);
        return newTodoId;
    }

    /**
     * @notice Reads the data of a single Todo item.
     * @param _todoId The ID of the todo to retrieve.
     * @return The Todo struct.
     */
    function getTodo(uint256 _todoId) external view returns (Todo memory) {
        if (!s_todos[_todoId].exists) {
            revert TodoList__NotFound();
        }
        return s_todos[_todoId];
    }

    /**
     * @notice Reads all existing Todo items in the system.
     * @return An array of all non-deleted Todo structs.
     */
    function getAllTodos() external view returns (Todo[] memory) {
        uint256 existingTodoCount = 0;
        for (uint i = 0; i < s_allTodoIds.length; i++) {
            if (s_todos[s_allTodoIds[i]].exists) {
                existingTodoCount++;
            }
        }

        Todo[] memory allExistingTodos = new Todo[](existingTodoCount);
        uint256 currentIndex = 0;
        
        for (uint i = 0; i < s_allTodoIds.length; i++) {
            uint256 todoId = s_allTodoIds[i];
            if (s_todos[todoId].exists) {
                allExistingTodos[currentIndex] = s_todos[todoId];
                currentIndex++;
            }
        }

        return allExistingTodos;
    }

    /**
     * @notice Updates the title of a specific Todo item.
     * @param _todoId The ID of the todo to update.
     * @param _newTitle The new title for the todo item.
     */
    function updateTodoTitle(uint256 _todoId, string calldata _newTitle) external {
        if (!s_todos[_todoId].exists) {
            revert TodoList__NotFound();
        }
        s_todos[_todoId].title = _newTitle;
        emit TodoTitleUpdated(_todoId);
    }

    /**
     * @notice Updates the text (description) of a specific Todo item.
     * @param _todoId The ID of the todo to update.
     * @param _newText The new text for the todo item.
     */
    function updateTodoText(uint256 _todoId, string calldata _newText) external {
        if (!s_todos[_todoId].exists) {
            revert TodoList__NotFound();
        }
        s_todos[_todoId].text = _newText;
        emit TodoTextUpdated(_todoId);
    }

    /**
     * @notice Updates the status of a todo (e.g., from PENDING to COMPLETED).
     * @param _todoId The ID of the todo to update.
     * @param _newStatus The new status.
     */
    function updateTodoStatus(uint256 _todoId, Status _newStatus) external {
        if (!s_todos[_todoId].exists) {
            revert TodoList__NotFound();
        }
        s_todos[_todoId].status = _newStatus;
        emit TodoStatusChanged(_todoId, _newStatus);
    }

    /**
     * @notice Deletes a Todo item from the list.
     * @dev This is a "soft delete". It marks the item as non-existent
     *      but does not restructure the array, saving significant gas.
     * @param _todoId The ID of the todo to delete.
     */
    function deleteTodo(uint256 _todoId) external {
        if (!s_todos[_todoId].exists) {
            revert TodoList__NotFound();
        }
        s_todos[_todoId].exists = false;
        emit TodoDeleted(_todoId);
    }
}
