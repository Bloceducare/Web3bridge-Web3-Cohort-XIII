// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title LudoGame
 * @dev A complete Ludo game implementation with token staking
 */
contract LudoGame is Ownable, ReentrancyGuard {
    IERC20 public immutable ludoToken;
    
    // Game constants
    uint256 public constant BOARD_SIZE = 52;
    uint256 public constant HOME_STRETCH_SIZE = 6;
    uint256 public constant MAX_PLAYERS = 4;
    uint256 public constant TOKENS_PER_PLAYER = 4;
    uint256 public constant WINNING_POSITION = 57; // Home stretch end
    
    // Colors enum
    enum Color { RED, GREEN, BLUE, YELLOW }
    
    // Game states
    enum GameState { WAITING, IN_PROGRESS, FINISHED }
    
    // Player structure
    struct Player {
        address playerAddress;
        string name;
        Color color;
        uint256 score;
        uint256[TOKENS_PER_PLAYER] tokenPositions; // Position of each token (0 = home, 1-52 = board, 53-57 = home stretch, 58 = finished)
        bool hasRegistered;
        bool hasStaked;
    }
    
    // Game structure
    struct Game {
        uint256 gameId;
        Player[MAX_PLAYERS] players;
        uint256 playerCount;
        uint256 currentPlayerIndex;
        uint256 stakeAmount;
        uint256 totalPrizePool;
        GameState state;
        address winner;
        uint256 createdAt;
        bool[] usedColors; // Track used colors [RED, GREEN, BLUE, YELLOW]
    }
    
    // State variables
    mapping(uint256 => Game) public games;
    mapping(address => uint256) public playerToGame; // Maps player address to current game ID
    uint256 public gameCounter;
    uint256 public defaultStakeAmount = 100 * 10**18; // 100 tokens default stake
    
    // Starting positions for each color on the main board
    mapping(Color => uint256) public colorStartPosition;
    
    // Events
    event GameCreated(uint256 indexed gameId, uint256 stakeAmount);
    event PlayerRegistered(uint256 indexed gameId, address indexed player, string name, Color color);
    event PlayerStaked(uint256 indexed gameId, address indexed player, uint256 amount);
    event GameStarted(uint256 indexed gameId);
    event DiceRolled(uint256 indexed gameId, address indexed player, uint256 diceValue);
    event TokenMoved(uint256 indexed gameId, address indexed player, uint256 tokenIndex, uint256 fromPosition, uint256 toPosition);
    event GameFinished(uint256 indexed gameId, address indexed winner, uint256 prizeAmount);
    
    // Modifiers
    modifier gameExists(uint256 _gameId) {
        require(_gameId > 0 && _gameId <= gameCounter, "Game does not exist");
        _;
    }
    
    modifier onlyRegisteredPlayer(uint256 _gameId) {
        require(playerToGame[msg.sender] == _gameId, "Not registered for this game");
        _;
    }
    
    modifier gameInProgress(uint256 _gameId) {
        require(games[_gameId].state == GameState.IN_PROGRESS, "Game not in progress");
        _;
    }
    
    modifier isCurrentPlayer(uint256 _gameId) {
        Game storage game = games[_gameId];
        require(game.players[game.currentPlayerIndex].playerAddress == msg.sender, "Not your turn");
        _;
    }
    
    constructor(address _ludoToken) Ownable(msg.sender) {
        ludoToken = IERC20(_ludoToken);
        
        // Initialize starting positions for each color
        colorStartPosition[Color.RED] = 1;
        colorStartPosition[Color.GREEN] = 14;
        colorStartPosition[Color.BLUE] = 27;
        colorStartPosition[Color.YELLOW] = 40;
    }
    
    function createGame(uint256 _stakeAmount) external {
        require(_stakeAmount > 0, "Stake amount must be greater than 0");
        
        gameCounter++;
        Game storage newGame = games[gameCounter];
        newGame.gameId = gameCounter;
        newGame.stakeAmount = _stakeAmount;
        newGame.state = GameState.WAITING;
        newGame.createdAt = block.timestamp;
        newGame.usedColors = new bool[](4); // Initialize all colors as unused
        
        emit GameCreated(gameCounter, _stakeAmount);
    }
    
    function registerPlayer(uint256 _gameId, string memory _name, Color _color) 
        external 
        gameExists(_gameId) 
    {
        Game storage game = games[_gameId];
        require(game.state == GameState.WAITING, "Game already started or finished");
        require(game.playerCount < MAX_PLAYERS, "Game is full");
        require(!game.usedColors[uint256(_color)], "Color already taken");
        require(playerToGame[msg.sender] == 0, "Already registered for a game");
        require(bytes(_name).length > 0, "Name cannot be empty");
        
        // Add player to game
        Player storage newPlayer = game.players[game.playerCount];
        newPlayer.playerAddress = msg.sender;
        newPlayer.name = _name;
        newPlayer.color = _color;
        newPlayer.hasRegistered = true;
        
        // Initialize all tokens at home (position 0)
        for (uint256 i = 0; i < TOKENS_PER_PLAYER; i++) {
            newPlayer.tokenPositions[i] = 0;
        }
        
        game.usedColors[uint256(_color)] = true;
        game.playerCount++;
        playerToGame[msg.sender] = _gameId;
        
        emit PlayerRegistered(_gameId, msg.sender, _name, _color);
    }
    
    function stakeTokens(uint256 _gameId) 
        external 
        gameExists(_gameId)
        onlyRegisteredPlayer(_gameId)
        nonReentrant 
    {
        Game storage game = games[_gameId];
        require(game.state == GameState.WAITING, "Game already started or finished");
        
        // Find player index
        uint256 playerIndex = getPlayerIndex(_gameId, msg.sender);
        require(!game.players[playerIndex].hasStaked, "Already staked");
        
        // Transfer tokens from player to contract
        require(
            ludoToken.transferFrom(msg.sender, address(this), game.stakeAmount),
            "Token transfer failed"
        );
        
        game.players[playerIndex].hasStaked = true;
        game.totalPrizePool += game.stakeAmount;
        
        emit PlayerStaked(_gameId, msg.sender, game.stakeAmount);
        
        // Check if all players have staked and start game
        if (allPlayersStaked(_gameId)) {
            startGame(_gameId);
        }
    }
    
    function startGame(uint256 _gameId) internal {
        Game storage game = games[_gameId];
        game.state = GameState.IN_PROGRESS;
        game.currentPlayerIndex = 0; // Red player starts
        
        emit GameStarted(_gameId);
    }
    
    function rollDiceAndMove(uint256 _gameId, uint256 _tokenIndex) 
        external 
        gameExists(_gameId)
        gameInProgress(_gameId)
        onlyRegisteredPlayer(_gameId)
        isCurrentPlayer(_gameId)
    {
        require(_tokenIndex < TOKENS_PER_PLAYER, "Invalid token index");
        
        // Generate dice roll
        uint256 diceValue = generateDiceRoll();
        emit DiceRolled(_gameId, msg.sender, diceValue);
        
        // Move token
        bool moved = moveToken(_gameId, _tokenIndex, diceValue);
        
        // Check for win condition
        if (checkWinCondition(_gameId)) {
            finishGame(_gameId);
            return;
        }
        
        // Move to next player (unless rolled 6 or moved a token out of home)
        if (diceValue != 6 && moved) {
            nextPlayer(_gameId);
        }
    }
    
    function generateDiceRoll() internal view returns (uint256) {
        uint256 randomHash = uint256(
            keccak256(
                abi.encodePacked(
                    block.timestamp,
                    block.prevrandao,
                    msg.sender,
                    gameCounter
                )
            )
        );
        return (randomHash % 6) + 1;
    }
    
    function moveToken(uint256 _gameId, uint256 _tokenIndex, uint256 _diceValue) 
        internal 
        returns (bool moved) 
    {
        Game storage game = games[_gameId];
        uint256 playerIndex = getPlayerIndex(_gameId, msg.sender);
        Player storage player = game.players[playerIndex];
        
        uint256 currentPosition = player.tokenPositions[_tokenIndex];
        uint256 newPosition = calculateNewPosition(player.color, currentPosition, _diceValue);
        
        // Check if move is valid
        if (!isValidMove(currentPosition, newPosition, _diceValue)) {
            return false;
        }
        
        // Check if position is occupied by own token
        if (isPositionOccupiedByOwnToken(_gameId, playerIndex, newPosition, _tokenIndex)) {
            return false;
        }
        
        // Check for capturing opponent tokens
        captureOpponentTokens(_gameId, playerIndex, newPosition);
        
        // Move the token
        player.tokenPositions[_tokenIndex] = newPosition;
        
        emit TokenMoved(_gameId, msg.sender, _tokenIndex, currentPosition, newPosition);
        
        return true;
    }
    
    function calculateNewPosition(Color _color, uint256 _currentPosition, uint256 _diceValue) 
        internal 
        view 
        returns (uint256) 
    {
        // Token at home
        if (_currentPosition == 0) {
            if (_diceValue == 6) {
                return colorStartPosition[_color]; // Move to starting position
            } else {
                return 0; // Stay at home
            }
        }
        
        // Token on main board (1-52)
        if (_currentPosition >= 1 && _currentPosition <= BOARD_SIZE) {
            uint256 homeStretchStart = getHomeStretchStart(_color);
            uint256 newPos = _currentPosition + _diceValue;
            
            // Check if entering home stretch
            if (_currentPosition < homeStretchStart && newPos >= homeStretchStart) {
                uint256 excess = newPos - homeStretchStart;
                return BOARD_SIZE + 1 + excess; // Enter home stretch
            }
            
            // Normal board movement
            if (newPos > BOARD_SIZE) {
                return (newPos - 1) % BOARD_SIZE + 1; // Wrap around board
            }
            
            return newPos;
        }
        
        // Token in home stretch (53-57)
        if (_currentPosition > BOARD_SIZE && _currentPosition < WINNING_POSITION) {
            uint256 newPos = _currentPosition + _diceValue;
            if (newPos > WINNING_POSITION) {
                return _currentPosition; // Can't overshoot winning position
            }
            return newPos;
        }
        
        return _currentPosition; // Token already finished
    }
    
    function getHomeStretchStart(Color _color) internal pure returns (uint256) {
        if (_color == Color.RED) return 51;
        if (_color == Color.GREEN) return 12;
        if (_color == Color.BLUE) return 25;
        if (_color == Color.YELLOW) return 38;
        return 0;
    }
    
    function isValidMove(uint256 _currentPosition, uint256 _newPosition, uint256 _diceValue) 
        internal 
        pure 
        returns (bool) 
    {
        // Can't move from home unless rolled 6
        if (_currentPosition == 0 && _diceValue != 6) {
            return false;
        }
        
        // Can't move finished tokens
        if (_currentPosition >= WINNING_POSITION) {
            return false;
        }
        
        return _newPosition != _currentPosition;
    }
    
    function isPositionOccupiedByOwnToken(
        uint256 _gameId, 
        uint256 _playerIndex, 
        uint256 _position, 
        uint256 _excludeTokenIndex
    ) internal view returns (bool) {
        Game storage game = games[_gameId];
        Player storage player = game.players[_playerIndex];
        
        for (uint256 i = 0; i < TOKENS_PER_PLAYER; i++) {
            if (i != _excludeTokenIndex && player.tokenPositions[i] == _position) {
                return true;
            }
        }
        return false;
    }
    
    function captureOpponentTokens(uint256 _gameId, uint256 _playerIndex, uint256 _position) internal {
        Game storage game = games[_gameId];
        
        // Only capture on main board (not in home stretch or special positions)
        if (_position == 0 || _position > BOARD_SIZE) {
            return;
        }
        
        for (uint256 i = 0; i < game.playerCount; i++) {
            if (i == _playerIndex) continue; // Skip own tokens
            
            Player storage opponent = game.players[i];
            for (uint256 j = 0; j < TOKENS_PER_PLAYER; j++) {
                if (opponent.tokenPositions[j] == _position) {
                    opponent.tokenPositions[j] = 0; // Send back to home
                }
            }
        }
    }
    
    function checkWinCondition(uint256 _gameId) internal view returns (bool) {
        Game storage game = games[_gameId];
        Player storage currentPlayer = game.players[game.currentPlayerIndex];
        
        // Check if all tokens reached winning position
        for (uint256 i = 0; i < TOKENS_PER_PLAYER; i++) {
            if (currentPlayer.tokenPositions[i] < WINNING_POSITION) {
                return false;
            }
        }
        
        return true;
    }
    
    function finishGame(uint256 _gameId) internal {
        Game storage game = games[_gameId];
        game.state = GameState.FINISHED;
        game.winner = game.players[game.currentPlayerIndex].playerAddress;
        
        // Update winner's score
        game.players[game.currentPlayerIndex].score += game.totalPrizePool;
        
        // Transfer prize to winner
        ludoToken.transfer(game.winner, game.totalPrizePool);
        
        // Clear player registrations
        for (uint256 i = 0; i < game.playerCount; i++) {
            playerToGame[game.players[i].playerAddress] = 0;
        }
        
        emit GameFinished(_gameId, game.winner, game.totalPrizePool);
    }
    
    function nextPlayer(uint256 _gameId) internal {
        Game storage game = games[_gameId];
        game.currentPlayerIndex = (game.currentPlayerIndex + 1) % game.playerCount;
    }
    
    function allPlayersStaked(uint256 _gameId) internal view returns (bool) {
        Game storage game = games[_gameId];
        for (uint256 i = 0; i < game.playerCount; i++) {
            if (!game.players[i].hasStaked) {
                return false;
            }
        }
        return true;
    }
    
    function getPlayerIndex(uint256 _gameId, address _player) internal view returns (uint256) {
        Game storage game = games[_gameId];
        for (uint256 i = 0; i < game.playerCount; i++) {
            if (game.players[i].playerAddress == _player) {
                return i;
            }
        }
        revert("Player not found");
    }
    
    // View functions
    function getGameInfo(uint256 _gameId) 
        external 
        view 
        gameExists(_gameId) 
        returns (
            uint256 gameId,
            uint256 playerCount,
            uint256 stakeAmount,
            uint256 totalPrizePool,
            GameState state,
            address winner,
            uint256 currentPlayerIndex
        ) 
    {
        Game storage game = games[_gameId];
        return (
            game.gameId,
            game.playerCount,
            game.stakeAmount,
            game.totalPrizePool,
            game.state,
            game.winner,
            game.currentPlayerIndex
        );
    }
    
    function getPlayerInfo(uint256 _gameId, uint256 _playerIndex) 
        external 
        view 
        gameExists(_gameId) 
        returns (
            address playerAddress,
            string memory name,
            Color color,
            uint256 score,
            uint256[TOKENS_PER_PLAYER] memory tokenPositions,
            bool hasStaked
        ) 
    {
        Game storage game = games[_gameId];
        require(_playerIndex < game.playerCount, "Invalid player index");
        
        Player storage player = game.players[_playerIndex];
        return (
            player.playerAddress,
            player.name,
            player.color,
            player.score,
            player.tokenPositions,
            player.hasStaked
        );
    }
    
    function getCurrentPlayer(uint256 _gameId) 
        external 
        view 
        gameExists(_gameId) 
        returns (address) 
    {
        Game storage game = games[_gameId];
        if (game.state != GameState.IN_PROGRESS) {
            return address(0);
        }
        return game.players[game.currentPlayerIndex].playerAddress;
    }
    
    // Admin functions
    function setDefaultStakeAmount(uint256 _amount) external onlyOwner {
        defaultStakeAmount = _amount;
    }
    
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = ludoToken.balanceOf(address(this));
        ludoToken.transfer(owner(), balance);
    }
}
