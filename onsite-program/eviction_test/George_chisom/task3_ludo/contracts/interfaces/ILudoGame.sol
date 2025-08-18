// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../libraries/LudoTypes.sol";

interface ILudoGame {
    function createGame(uint256 stakeAmount) external returns (uint256);
    function registerPlayer(uint256 gameId, string memory name, LudoTypes.Color color) external;
    function stakeTokens(uint256 gameId) external;
    function rollDice(uint256 gameId) external returns (uint256);
    function makeMove(uint256 gameId, uint256 diceValue) external;
    
    function getGameInfo(uint256 gameId) external view returns (
        uint256 gameId_,
        uint8 playerCount,
        uint8 currentPlayerIndex,
        LudoTypes.GameState state,
        uint256 stakeAmount,
        uint256 totalPrize,
        address winner
    );
    
    function getPlayerInfo(uint256 gameId, uint8 playerIndex) external view returns (
        address playerAddress,
        string memory name,
        LudoTypes.Color color,
        uint256 score,
        uint256 position,
        bool isRegistered,
        bool hasStaked
    );
    
    function getCurrentPlayer(uint256 gameId) external view returns (address);
    function isColorAvailable(uint256 gameId, LudoTypes.Color color) external view returns (bool);
    function gameCounter() external view returns (uint256);
    function playerCurrentGame(address player) external view returns (uint256);
}
