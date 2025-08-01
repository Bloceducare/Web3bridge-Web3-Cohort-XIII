// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.30;

contract Todo {
    struct Task {
        string Title;
        string Description;
        bool Status;
    }

    
    mapping(address => mapping(uint256 => Task)) private userTasks;
   
    mapping(address => uint256[]) private taskIds;
    
    mapping(address => uint256) private taskCounter;

   
    function createTask(
        address user,
        string memory _title,
        string memory _description
    ) external {
        taskCounter[user]++;
        uint256 taskId = taskCounter[user];

        userTasks[user][taskId] = Task({
            Title: _title,
            Description: _description,
            Status: false
        });

        taskIds[user].push(taskId);
    }

   
    function updateTask(
        address user,
        uint256 taskId,
        string memory _newTitle,
        string memory _newDescription
    ) external {
        require(bytes(userTasks[user][taskId].Title).length != 0, "Task does not exist");
        userTasks[user][taskId].Title = _newTitle;
        userTasks[user][taskId].Description = _newDescription;
    }

    
    function toggleStatus(address user, uint256 taskId) external {
        require(bytes(userTasks[user][taskId].Title).length != 0, "Task does not exist");
        userTasks[user][taskId].Status = !userTasks[user][taskId].Status;
    }

    
    function deleteTask(address user, uint256 taskId) external {
        require(bytes(userTasks[user][taskId].Title).length != 0, "Task does not exist");

        delete userTasks[user][taskId];

        
        uint256[] storage ids = taskIds[user];
        for (uint256 i = 0; i < ids.length; i++) {
            if (ids[i] == taskId) {
                ids[i] = ids[ids.length - 1];
                ids.pop();
                break;
            }
        }
    }

    
    function getTasks(address user) external view returns (Task[] memory) {
        uint256[] storage ids = taskIds[user];
        Task[] memory tasks = new Task[](ids.length);

        for (uint256 i = 0; i < ids.length; i++) {
            tasks[i] = userTasks[user][ids[i]];
        }

        return tasks;
    }
}
