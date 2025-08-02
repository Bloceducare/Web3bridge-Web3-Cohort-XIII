// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

contract Todo {

    struct Task {
        string title;
        string description;
        bool completed;
    }

    mapping(address => Task[]) private userTasks;

    function createTask(string memory _title, string memory _description) external {
        userTasks[msg.sender].push(Task(_title, _description, false));
    }

    function updateTask(uint _index, string memory _newTitle, string memory _newDescription) external {
        require(_index < userTasks[msg.sender].length, "Invalid Index");
        Task storage t = userTasks[msg.sender][_index];
        t.title = _newTitle;
        t.description = _newDescription;
    }

    function toggleTaskStatus(uint _index) external {
        require(_index < userTasks[msg.sender].length, "Invalid Index");
        userTasks[msg.sender][_index].completed = !userTasks[msg.sender][_index].completed;
    }

    function getTasks() external view returns (Task[] memory) {
        return userTasks[msg.sender];
    }

    function deleteTask(uint _index) external {
        require(_index < userTasks[msg.sender].length, "Invalid Index");

        uint lastIndex = userTasks[msg.sender].length - 1;
        userTasks[msg.sender][_index] = userTasks[msg.sender][lastIndex];
        userTasks[msg.sender].pop();
    }
}