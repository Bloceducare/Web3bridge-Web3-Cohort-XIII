// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.30;

import "./Todo.sol";

contract TodoFactory {
    address[] public allTodos;

    event TodoCreated(address indexed creator, address todoAddress);

    function createTodo() external {
        Todo todo = new Todo();
        allTodos.push(address(todo));
        emit TodoCreated(msg.sender, address(todo));
    }

    function getAllTodos() external view returns (address[] memory) {
        return allTodos;
    }
    // https://sepolia-blockscout.lisk.com/address/0xAc9c6fd383B9Df7d12Be1b6d3E510612917B5384#code
}
