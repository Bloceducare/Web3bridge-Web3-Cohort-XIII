// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

library LudoTypes {
    enum Color { RED, GREEN, BLUE, YELLOW }
    enum GameState { WAITING, ACTIVE, FINISHED }
    
    struct Player {
        address playerAddress;
        string name;
        Color color;
        uint256 score;
        uint256 position;
        bool isRegistered;
        bool hasStaked;
    }
    
    struct Game {
        uint256 gameId;
        Player[4] players;
        uint8 playerCount;
        uint8 currentPlayerIndex;
        GameState state;
        uint256 stakeAmount;
        uint256 totalPrize;
        address winner;
        uint256 createdAt;
    }
}
