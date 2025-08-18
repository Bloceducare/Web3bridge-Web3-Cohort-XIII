// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./LudoTypes.sol";

library LudoEvents {
    event PlayerRegistered(
        uint256 indexed gameId, 
        address indexed player, 
        string name, 
        LudoTypes.Color color
    );
    
    event GameStarted(uint256 indexed gameId, uint256 stakeAmount);
    
    event DiceRolled(
        uint256 indexed gameId, 
        address indexed player, 
        uint256 diceValue
    );
    
    event PlayerMoved(
        uint256 indexed gameId, 
        address indexed player, 
        uint256 newPosition
    );
    
    event GameFinished(
        uint256 indexed gameId, 
        address indexed winner, 
        uint256 prize
    );
    
    event GameCreated(
        uint256 indexed gameId, 
        address indexed creator, 
        uint256 stakeAmount
    );
}
