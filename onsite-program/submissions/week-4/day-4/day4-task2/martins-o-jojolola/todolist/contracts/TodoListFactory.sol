// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./TodoList.sol";

contract TodoListFactory {
    error InvalidOwnerAddress(string reason);
    error EmptyListName(string reason);
    error TodoListAlreadyExists(string reason);
    error TodoListNotFound(string reason);

    struct TodoListInfo {
        string name;
        address contractAddress;
        address owner;
        uint256 creationTimestamp;
        bool isActive;
    }

    address[] public deployedTodoLists;

    mapping(string => TodoListInfo) public todoLists;

    mapping(address => address[]) public ownerToTodoLists;

    mapping(string => bool) public listNameTaken;

    uint256 public totalDeployedLists;

    event TodoListDeployed(
        string indexed listName,
        address indexed contractAddress,
        address indexed owner,
        uint256 timestamp
    );

    event TodoListDeactivated(
        string indexed listName,
        address indexed contractAddress,
        address indexed owner
    );

    function deployTodoList(
        string memory _listName
    ) external returns (address) {
        if (msg.sender == address(0)) {
            revert InvalidOwnerAddress("Owner address cannot be zero");
        }
        if (bytes(_listName).length == 0) {
            revert EmptyListName("List name cannot be empty");
        }
        if (listNameTaken[_listName]) {
            revert TodoListAlreadyExists(
                "TodoList with this name already exists"
            );
        }

        TodoList newTodoList = new TodoList();
        address contractAddress = address(newTodoList);

        todoLists[_listName] = TodoListInfo({
            name: _listName,
            contractAddress: contractAddress,
            owner: msg.sender,
            creationTimestamp: block.timestamp,
            isActive: true
        });

        listNameTaken[_listName] = true;
        deployedTodoLists.push(contractAddress);
        ownerToTodoLists[msg.sender].push(contractAddress);
        totalDeployedLists++;

        emit TodoListDeployed(
            _listName,
            contractAddress,
            msg.sender,
            block.timestamp
        );

        return contractAddress;
    }

    function getTodoListContract(
        string memory _listName
    ) external view returns (address) {
        if (!listNameTaken[_listName]) {
            revert TodoListNotFound("TodoList not found");
        }
        return todoLists[_listName].contractAddress;
    }

    function getTodoListInfo(
        string memory _listName
    ) external view returns (TodoListInfo memory) {
        if (!listNameTaken[_listName]) {
            revert TodoListNotFound("TodoList not found");
        }
        return todoLists[_listName];
    }

    function getTodoListsByOwner(
        address _owner
    ) external view returns (address[] memory) {
        return ownerToTodoLists[_owner];
    }

    function getAllTodoLists() external view returns (address[] memory) {
        return deployedTodoLists;
    }

    function getDetailedTodoListsByOwner(
        address _owner
    ) external view returns (TodoListInfo[] memory) {
        address[] memory ownerContracts = ownerToTodoLists[_owner];
        TodoListInfo[] memory detailedInfo = new TodoListInfo[](
            ownerContracts.length
        );

        uint256 count = 0;
        for (uint256 i = 0; i < deployedTodoLists.length; i++) {
            address contractAddr = deployedTodoLists[i];

            for (uint256 j = 0; j < ownerContracts.length; j++) {
                if (ownerContracts[j] == contractAddr) {
                    string memory listName = getListNameByContract(
                        contractAddr
                    );
                    if (bytes(listName).length > 0) {
                        detailedInfo[count] = todoLists[listName];
                        count++;
                    }
                    break;
                }
            }
        }

        assembly {
            mstore(detailedInfo, count)
        }

        return detailedInfo;
    }

    function deactivateTodoList(string memory _listName) external {
        if (!listNameTaken[_listName]) {
            revert TodoListNotFound("TodoList not found");
        }

        TodoListInfo storage listInfo = todoLists[_listName];

        if (listInfo.owner != msg.sender) {
            revert InvalidOwnerAddress(
                "Only owner can deactivate this TodoList"
            );
        }

        listInfo.isActive = false;

        emit TodoListDeactivated(
            _listName,
            listInfo.contractAddress,
            msg.sender
        );
    }

    function isListNameTaken(
        string memory _listName
    ) external view returns (bool) {
        return listNameTaken[_listName];
    }

    function getActiveTodoListsCount() external view returns (uint256) {
        uint256 activeCount = 0;
        for (uint256 i = 0; i < deployedTodoLists.length; i++) {
            string memory listName = getListNameByContract(
                deployedTodoLists[i]
            );
            if (bytes(listName).length > 0 && todoLists[listName].isActive) {
                activeCount++;
            }
        }
        return activeCount;
    }

    function getListNameByContract(
        address _contractAddress
    ) internal view returns (string memory) {
        for (uint256 i = 0; i < deployedTodoLists.length; i++) {
            if (deployedTodoLists[i] == _contractAddress) {
                break;
            }
        }
        return "";
    }

    function getCreationTimestamp(
        string memory _listName
    ) external view returns (uint256) {
        if (!listNameTaken[_listName]) {
            revert TodoListNotFound("TodoList not found");
        }
        return todoLists[_listName].creationTimestamp;
    }
}
