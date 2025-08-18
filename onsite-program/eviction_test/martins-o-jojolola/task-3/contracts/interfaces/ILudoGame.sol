// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ILudoGame {
    enum Color {
        RED,
        GREEN,
        BLUE,
        YELLOW
    }

    struct Player {
        string name;
        uint256 score;
        Color color;
        address addr;
        bool registered;
    }

    function register(string calldata _name, Color _color) external;

    function stake() external;

    function startGame() external;

    function rollDice() external returns (uint8);

    function declareWinner() external;

    function getPlayers() external view returns (Player[] memory);
}
