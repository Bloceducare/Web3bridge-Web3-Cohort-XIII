// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./ILudoGame.sol";

contract LudoGame is ILudoGame {
    uint256 public constant MAX_PLAYERS = 4;
    uint256 public constant BOARD_SIZE = 52;
    
    Player[] private players;
    address private currentPlayer;
    uint256 private currentPlayerIndex;
    GameState private gameState;
    address private winner;
    
    mapping(address => bool) private registeredPlayers;
    mapping(Color => bool) private usedColors;
    
    modifier onlyRegisteredPlayer() {
        require(registeredPlayers[msg.sender], "Player not registered");
        _;
    }
    
    modifier onlyCurrentPlayer() {
        require(msg.sender == currentPlayer, "Not your turn");
        _;
    }
    
    modifier onlyGameState(GameState _state) {
        require(gameState == _state, "Invalid game state");
        _;
    }
    
    function registerPlayer(string memory name, Color color) external override {
        require(players.length < MAX_PLAYERS, "Maximum players reached");
        require(!registeredPlayers[msg.sender], "Player already registered");
        require(!usedColors[color], "Color already taken");
        
        players.push(Player({
            playerAddress: msg.sender,
            name: name,
            color: color,
            score: 0,
            position: 0,
            hasWon: false
        }));
        
        registeredPlayers[msg.sender] = true;
        usedColors[color] = true;
        
        emit PlayerRegistered(msg.sender, name, color);
    }
    
    function startGame() external override onlyGameState(GameState.WAITING) {
        require(players.length >= 2, "Need at least 2 players to start");
        gameState = GameState.STARTED;
        currentPlayerIndex = 0;
        currentPlayer = players[currentPlayerIndex].playerAddress;
        
        emit GameStarted();
    }
    
    function rollDice() external override 
        onlyRegisteredPlayer 
        onlyCurrentPlayer 
        onlyGameState(GameState.STARTED) 
        returns (uint256) {
        uint256 diceValue = _generateRandomDiceValue();
        emit DiceRolled(msg.sender, diceValue);
        return diceValue;
    }
    
    function movePlayer(uint256 steps) external override 
        onlyRegisteredPlayer 
        onlyCurrentPlayer 
        onlyGameState(GameState.STARTED) {
        require(steps >= 1 && steps <= 6, "Invalid dice value");
        
        for (uint256 i = 0; i < players.length; i++) {
            if (players[i].playerAddress == msg.sender) {
                uint256 oldPosition = players[i].position;
                uint256 newPosition = (oldPosition + steps) % BOARD_SIZE;
                players[i].position = newPosition;

                // Check if player completed a full round
                if (oldPosition + steps >= BOARD_SIZE) {
                    players[i].score += 1;

                    // Check for win condition (e.g., first to 3 laps)
                    if (players[i].score >= 3) {
                        players[i].hasWon = true;
                        winner = players[i].playerAddress;
                        gameState = GameState.COMPLETED;
                        emit GameCompleted(winner);
                        return;
                    }
                }

                emit PlayerMoved(msg.sender, newPosition);
                break;
            }
        }
        
        // Move to next player
        _nextPlayer();
    }
    
    function getPlayers() external view override returns (Player[] memory) {
        return players;
    }
    
    function getCurrentPlayer() external view override returns (address) {
        return currentPlayer;
    }
    
    function getGameState() external view override returns (GameState) {
        return gameState;
    }
    
    function getWinner() external view override returns (address) {
        return winner;
    }
    
    function _nextPlayer() private {
        currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
        currentPlayer = players[currentPlayerIndex].playerAddress;
    }
    
    function _generateRandomDiceValue() private view returns (uint256) {
        // This is a simple pseudo-random implementation. In production, consider using Chainlink VRF
        return uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao, msg.sender))) % 6 + 1;
    }
}