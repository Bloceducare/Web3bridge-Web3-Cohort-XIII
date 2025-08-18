// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface ILudoGame {
    enum Color { RED, GREEN, BLUE, YELLOW }
    enum GameState { WAITING, STARTED, COMPLETED }

    struct Player {
        address playerAddress;
        string name;
        Color color;
        uint256 score;
        uint256 position;
        bool hasWon;
    }

    event PlayerRegistered(address indexed player, string name, Color color);
    event DiceRolled(address indexed player, uint256 value);
    event PlayerMoved(address indexed player, uint256 newPosition);
    event GameStarted();
    event GameCompleted(address indexed winner);

    function registerPlayer(string memory name, Color color) external;
    function startGame() external;
    function rollDice() external returns (uint256);
    function movePlayer(uint256 steps) external;
    function getPlayers() external view returns (Player[] memory);
    function getCurrentPlayer() external view returns (address);
    function getGameState() external view returns (GameState);
    function getWinner() external view returns (address);
}