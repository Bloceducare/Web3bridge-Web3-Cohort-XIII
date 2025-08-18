// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract LudoGame {
    enum Color { RED, GREEN, BLUE, YELLOW }
    enum GameState { WAITING_FOR_PLAYERS, IN_PROGRESS, FINISHED }
    
    struct Player {
        address playerAddress;
        string name;
        Color color;
        uint256 score;
        bool isRegistered;
        uint256 position; 
    }
    
    IERC20 public stakingToken;
    uint256 public stakeAmount;
    uint256 public gameId;
    GameState public currentGameState;
    
    mapping(uint256 => mapping(address => Player)) public players;
    mapping(uint256 => address[]) public gamePlayers;
    mapping(uint256 => address) public gameWinner;
    mapping(uint256 => uint256) public totalStaked;
    mapping(uint256 => address) public currentTurn;
    mapping(uint256 => uint256) public turnIndex;
    
    // Events
    event PlayerRegistered(uint256 indexed gameId, address indexed player, string name, Color color);
    event GameStarted(uint256 indexed gameId, address[] players);
    event DiceRolled(uint256 indexed gameId, address indexed player, uint256 diceValue);
    event PlayerMoved(uint256 indexed gameId, address indexed player, uint256 newPosition);
    event GameFinished(uint256 indexed gameId, address indexed winner, uint256 totalPrize);
    
    constructor(address _stakingToken, uint256 _stakeAmount) {
        stakingToken = IERC20(_stakingToken);
        stakeAmount = _stakeAmount;
        gameId = 1;
        currentGameState = GameState.WAITING_FOR_PLAYERS;
    }
    
    modifier onlyDuringState(GameState _state) {
        require(currentGameState == _state, "Invalid game state");
        _;
    }
    
    modifier onlyCurrentPlayer() {
        require(msg.sender == currentTurn[gameId], "Not your turn");
        _;
    }
    
    modifier validColor(Color _color) {
        require(uint8(_color) < 4, "Invalid color");
        _;
    }
    
    function registerPlayer(string memory _name, Color _color) 
        external 
        onlyDuringState(GameState.WAITING_FOR_PLAYERS)
        validColor(_color)
    {
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(!players[gameId][msg.sender].isRegistered, "Player already registered");
        require(gamePlayers[gameId].length < 4, "Maximum 4 players allowed");
        
        // Check if color is already taken
        for (uint i = 0; i < gamePlayers[gameId].length; i++) {
            require(players[gameId][gamePlayers[gameId][i]].color != _color, "Color already taken");
        }
        
        // Transfer stake from player
        require(stakingToken.transferFrom(msg.sender, address(this), stakeAmount), "Stake transfer failed");
        
        // Register player
        players[gameId][msg.sender] = Player({
            playerAddress: msg.sender,
            name: _name,
            color: _color,
            score: 0,
            isRegistered: true,
            position: 0
        });
        
        gamePlayers[gameId].push(msg.sender);
        totalStaked[gameId] += stakeAmount;
        
        emit PlayerRegistered(gameId, msg.sender, _name, _color);
        
        // Start game if 4 players registered
        if (gamePlayers[gameId].length == 4) {
            _startGame();
        }
    }
    
    function _startGame() internal {
        currentGameState = GameState.IN_PROGRESS;
        currentTurn[gameId] = gamePlayers[gameId][0];
        turnIndex[gameId] = 0;
        
        emit GameStarted(gameId, gamePlayers[gameId]);
    }
    
    function rollDice() external onlyDuringState(GameState.IN_PROGRESS) onlyCurrentPlayer returns (uint256) {
        uint256 diceValue = _generateRandomNumber() % 6 + 1;
        
        emit DiceRolled(gameId, msg.sender, diceValue);
        
        // Move player
        _movePlayer(msg.sender, diceValue);
        
        // Check for win condition (simplified: reach position 100)
        if (players[gameId][msg.sender].position >= 100) {
            _endGame(msg.sender);
        } else {
            _nextTurn();
        }
        
        return diceValue;
    }
    
    function _movePlayer(address _player, uint256 _diceValue) internal {
        uint256 newPosition = players[gameId][_player].position + _diceValue;
        
        // Simple boundary check
        if (newPosition > 100) {
            newPosition = 100;
        }
        
        players[gameId][_player].position = newPosition;
        players[gameId][_player].score += _diceValue;
        
        emit PlayerMoved(gameId, _player, newPosition);
    }
    
    function _nextTurn() internal {
        turnIndex[gameId] = (turnIndex[gameId] + 1) % gamePlayers[gameId].length;
        currentTurn[gameId] = gamePlayers[gameId][turnIndex[gameId]];
    }
    
    function _endGame(address _winner) internal {
        currentGameState = GameState.FINISHED;
        gameWinner[gameId] = _winner;
        
        // Transfer all staked tokens to winner
        uint256 totalPrize = totalStaked[gameId];
        require(stakingToken.transfer(_winner, totalPrize), "Prize transfer failed");
        
        emit GameFinished(gameId, _winner, totalPrize);
        
        // Prepare for next game
        gameId++;
        currentGameState = GameState.WAITING_FOR_PLAYERS;
    }
    
    function _generateRandomNumber() internal view returns (uint256) {
        // Simple pseudo-random number generation
        // Note: This is not cryptographically secure and should not be used in production
        return uint256(keccak256(abi.encodePacked(
            block.timestamp,            
            msg.sender,
            block.number
        )));
    }
    
    // View functions
    function getGamePlayers(uint256 _gameId) external view returns (address[] memory) {
        return gamePlayers[_gameId];
    }
    
    function getPlayerInfo(uint256 _gameId, address _player) external view returns (
        string memory name,
        Color color,
        uint256 score,
        uint256 position,
        bool isRegistered
    ) {
        Player memory player = players[_gameId][_player];
        return (player.name, player.color, player.score, player.position, player.isRegistered);
    }
    
    function getCurrentGameInfo() external view returns (
        uint256 currentGameId,
        GameState state,
        uint256 playersCount,
        address currentPlayer,
        uint256 staked
    ) {
        return (
            gameId,
            currentGameState,
            gamePlayers[gameId].length,
            currentTurn[gameId],
            totalStaked[gameId]
        );
    }
    
    function getWinner(uint256 _gameId) external view returns (address) {
        return gameWinner[_gameId];
    }
}
