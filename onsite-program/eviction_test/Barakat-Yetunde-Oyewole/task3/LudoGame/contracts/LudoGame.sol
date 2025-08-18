// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./LudoToken.sol";

contract LudoGame {
    LudoToken public ludoToken;
    
    struct Game {
        uint256 id;
        address[4] players;
        uint256 entryFee;
        bool isActive;
        address winner;
        uint256 createdAt;
    }
    
    mapping(uint256 => Game) public games;
    mapping(address => uint256) public playerGames;
    uint256 public gameCounter;
    
    event GameCreated(uint256 gameId, address creator, uint256 entryFee);
    event PlayerJoined(uint256 gameId, address player);
    event GameCompleted(uint256 gameId, address winner, uint256 prize);
    
    constructor(address _ludoToken) {
        ludoToken = LudoToken(_ludoToken);
    }
    
    function createGame(uint256 _entryFee) external {
        require(_entryFee > 0, "Entry fee must be greater than 0");
        require(ludoToken.balanceOf(msg.sender) >= _entryFee, "Insufficient balance");
        
        gameCounter++;
        Game storage newGame = games[gameCounter];
        newGame.id = gameCounter;
        newGame.players[0] = msg.sender;
        newGame.entryFee = _entryFee;
        newGame.isActive = true;
        newGame.createdAt = block.timestamp;
        
        ludoToken.transferFrom(msg.sender, address(this), _entryFee);
        playerGames[msg.sender] = gameCounter;
        
        emit GameCreated(gameCounter, msg.sender, _entryFee);
    }
    
    function joinGame(uint256 _gameId) external {
        Game storage game = games[_gameId];
        require(game.isActive, "Game is not active");
        require(ludoToken.balanceOf(msg.sender) >= game.entryFee, "Insufficient balance");
        
        // Find empty slot
        bool joined = false;
        for (uint i = 0; i < 4; i++) {
            if (game.players[i] == address(0)) {
                game.players[i] = msg.sender;
                joined = true;
                break;
            }
        }
        require(joined, "Game is full");
        
        ludoToken.transferFrom(msg.sender, address(this), game.entryFee);
        playerGames[msg.sender] = _gameId;
        
        emit PlayerJoined(_gameId, msg.sender);
    }
    
    function completeGame(uint256 _gameId, address _winner) external {
        Game storage game = games[_gameId];
        require(game.isActive, "Game is not active");
        
        // Verify winner is a player in the game
        bool isPlayer = false;
        for (uint i = 0; i < 4; i++) {
            if (game.players[i] == _winner) {
                isPlayer = true;
                break;
            }
        }
        require(isPlayer, "Winner must be a player in the game");
        
        game.isActive = false;
        game.winner = _winner;
        
        // Calculate prize (total entry fees)
        uint256 totalPlayers = 0;
        for (uint i = 0; i < 4; i++) {
            if (game.players[i] != address(0)) {
                totalPlayers++;
            }
        }
        
        uint256 prize = game.entryFee * totalPlayers;
        ludoToken.transfer(_winner, prize);
        
        emit GameCompleted(_gameId, _winner, prize);
    }
    
    function getGame(uint256 _gameId) external view returns (Game memory) {
        return games[_gameId];
    }
}