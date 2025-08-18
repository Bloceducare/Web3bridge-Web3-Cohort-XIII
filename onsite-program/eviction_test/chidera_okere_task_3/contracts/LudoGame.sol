// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./Lock.sol";

contract LudoGame {
    GameToken public gameToken;
    
    
    enum Color { RED, BLUE, GREEN, YELLOW }
    
    // Player structure
    struct Player {
        string name;
        address playerAddress;
        Color color;
        uint256 score;
        bool isRegistered;
        bool hasStaked;
        uint256 position; 
    }
    
    // Game structure
    struct Game {
        uint256 gameId;
        Player[4] players;
        uint8 playerCount;
        uint256 stakeAmount;
        bool gameStarted;
        bool gameEnded;
        address winner;
        uint256 totalPrize;
        uint8 currentPlayerTurn; 
    }
    
    // State variables
    uint256 public gameCounter;
    uint256 public constant STAKE_AMOUNT = 10 * 10**18; // 10 tokens
    uint256 public constant WINNING_POSITION = 100;
    
    mapping(uint256 => Game) public games;
    mapping(address => uint256) public playerToGame;
    
    // Events
    event PlayerRegistered(uint256 gameId, address player, string name, Color color);
    event GameStarted(uint256 gameId);
    event DiceRolled(uint256 gameId, address player, uint8 diceValue);
    event PlayerMoved(uint256 gameId, address player, uint256 newPosition);
    event GameEnded(uint256 gameId, address winner, uint256 prize);
    
    constructor(address _gameToken) {
        gameToken = GameToken(_gameToken);
    }
    
    // Create a new game
    function createGame() public returns (uint256) {
        gameCounter++;
        games[gameCounter].gameId = gameCounter;
        games[gameCounter].stakeAmount = STAKE_AMOUNT;
        return gameCounter;
    }
    
    // Register player for a game
    function registerPlayer(uint256 _gameId, string memory _name, Color _color) public {
        require(_gameId > 0 && _gameId <= gameCounter, "Invalid game ID");
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(!games[_gameId].gameStarted, "Game already started");
        require(games[_gameId].playerCount < 4, "Game is full");
        require(playerToGame[msg.sender] == 0, "Player already in a game");
        
        // Check if color is already taken
        for (uint8 i = 0; i < games[_gameId].playerCount; i++) {
            require(games[_gameId].players[i].color != _color, "Color already taken");
        }
        
        uint8 playerIndex = games[_gameId].playerCount;
        games[_gameId].players[playerIndex] = Player({
            name: _name,
            playerAddress: msg.sender,
            color: _color,
            score: 0,
            isRegistered: true,
            hasStaked: false,
            position: 0
        });
        
        games[_gameId].playerCount++;
        playerToGame[msg.sender] = _gameId;
        
        emit PlayerRegistered(_gameId, msg.sender, _name, _color);
    }
    
    // Stake tokens to join game
    function stakeTokens(uint256 _gameId) public {
        require(playerToGame[msg.sender] == _gameId, "Not registered for this game");
        require(!games[_gameId].gameStarted, "Game already started");
        
        // Find player index
        uint8 playerIndex = getPlayerIndex(_gameId, msg.sender);
        require(!games[_gameId].players[playerIndex].hasStaked, "Already staked");
        
        // Transfer tokens from player to contract
        require(gameToken.transferFrom(msg.sender, address(this), STAKE_AMOUNT), "Token transfer failed");
        
        games[_gameId].players[playerIndex].hasStaked = true;
        games[_gameId].totalPrize += STAKE_AMOUNT;
        
        // Check if all players have staked
        bool allStaked = true;
        for (uint8 i = 0; i < games[_gameId].playerCount; i++) {
            if (!games[_gameId].players[i].hasStaked) {
                allStaked = false;
                break;
            }
        }
        
        // Start game if all players staked and we have at least 2 players
        if (allStaked && games[_gameId].playerCount >= 2) {
            games[_gameId].gameStarted = true;
            games[_gameId].currentPlayerTurn = 0;
            emit GameStarted(_gameId);
        }
    }
    
    // Simple dice rolling algorithm
    function rollDice(uint256 _gameId) public returns (uint8) {
        require(games[_gameId].gameStarted && !games[_gameId].gameEnded, "Game not active");
        require(playerToGame[msg.sender] == _gameId, "Not in this game");
        
        uint8 playerIndex = getPlayerIndex(_gameId, msg.sender);
        require(playerIndex == games[_gameId].currentPlayerTurn, "Not your turn");
        
        // Simple random number generation (not secure for production)
        uint8 diceValue = uint8((uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.difficulty,
            msg.sender,
            _gameId
        ))) % 6) + 1);
        
        emit DiceRolled(_gameId, msg.sender, diceValue);
        
        // Move player
        movePlayer(_gameId, playerIndex, diceValue);
        
        // Move to next player's turn
        games[_gameId].currentPlayerTurn = (games[_gameId].currentPlayerTurn + 1) % games[_gameId].playerCount;
        
        return diceValue;
    }
    
    // Move player based on dice roll
    function movePlayer(uint256 _gameId, uint8 _playerIndex, uint8 _diceValue) internal {
        games[_gameId].players[_playerIndex].position += _diceValue;
        
        // Check if player won
        if (games[_gameId].players[_playerIndex].position >= WINNING_POSITION) {
            games[_gameId].players[_playerIndex].position = WINNING_POSITION;
            endGame(_gameId, games[_gameId].players[_playerIndex].playerAddress);
        }
        
        emit PlayerMoved(_gameId, games[_gameId].players[_playerIndex].playerAddress, 
                        games[_gameId].players[_playerIndex].position);
    }
    
    // End game and distribute prize
    function endGame(uint256 _gameId, address _winner) internal {
        games[_gameId].gameEnded = true;
        games[_gameId].winner = _winner;
        
        // Transfer all tokens to winner
        require(gameToken.transfer(_winner, games[_gameId].totalPrize), "Prize transfer failed");
        
        // Update winner's score
        uint8 winnerIndex = getPlayerIndex(_gameId, _winner);
        games[_gameId].players[winnerIndex].score += 1;
        
        // Clear player mappings
        for (uint8 i = 0; i < games[_gameId].playerCount; i++) {
            playerToGame[games[_gameId].players[i].playerAddress] = 0;
        }
        
        emit GameEnded(_gameId, _winner, games[_gameId].totalPrize);
    }
    
    // Helper function to get player index
    function getPlayerIndex(uint256 _gameId, address _player) internal view returns (uint8) {
        for (uint8 i = 0; i < games[_gameId].playerCount; i++) {
            if (games[_gameId].players[i].playerAddress == _player) {
                return i;
            }
        }
        revert("Player not found");
    }
    
    // View functions
    function getGameInfo(uint256 _gameId) public view returns (
        uint256 gameId,
        uint8 playerCount,
        uint256 stakeAmount,
        bool gameStarted,
        bool gameEnded,
        address winner,
        uint256 totalPrize,
        uint8 currentPlayerTurn
    ) {
        Game memory game = games[_gameId];
        return (
            game.gameId,
            game.playerCount,
            game.stakeAmount,
            game.gameStarted,
            game.gameEnded,
            game.winner,
            game.totalPrize,
            game.currentPlayerTurn
        );
    }
    
    function getPlayerInfo(uint256 _gameId, uint8 _playerIndex) public view returns (
        string memory name,
        address playerAddress,
        Color color,
        uint256 score,
        bool isRegistered,
        bool hasStaked,
        uint256 position
    ) {
        require(_playerIndex < games[_gameId].playerCount, "Invalid player index");
        Player memory player = games[_gameId].players[_playerIndex];
        return (
            player.name,
            player.playerAddress,
            player.color,
            player.score,
            player.isRegistered,
            player.hasStaked,
            player.position
        );
    }
    
    function getCurrentGame(address _player) public view returns (uint256) {
        return playerToGame[_player];
    }
}
