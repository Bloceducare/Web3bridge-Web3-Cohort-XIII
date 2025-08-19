// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title LudoGame Smart Contract
 * @dev A decentralized Ludo game where users can register, stake tokens, and play
 * @author Jethro - Web3bridge Cohort XIII
 */
contract LudoGame {
    // Game constants
    uint256 public constant STAKE_AMOUNT = 0.01 ether;
    uint256 public constant MAX_PLAYERS = 4;
    uint256 public constant BOARD_SIZE = 52;
    
    // Player colors
    enum Color { RED, GREEN, BLUE, YELLOW }
    
    // Game states
    enum GameState { WAITING, ACTIVE, FINISHED }
    
    // Player structure
    struct Player {
        address playerAddress;
        string name;
        Color color;
        uint256 position;
        bool isRegistered;
        bool hasStaked;
        uint256 score;
    }
    
    // Game structure
    struct Game {
        uint256 gameId;
        Player[MAX_PLAYERS] players;
        uint256 playerCount;
        GameState state;
        uint256 currentTurn;
        uint256 prizePool;
        address winner;
        uint256 createdAt;
    }
    
    // State variables
    mapping(uint256 => Game) public games;
    mapping(address => uint256) public playerToGame;
    mapping(address => bool) public registeredPlayers;
    mapping(address => string) public playerNames;
    mapping(address => Color) public playerColors;
    mapping(address => uint256) public playerScores;
    
    uint256 public gameCounter;
    uint256 public totalStaked;
    
    // Events
    event PlayerRegistered(address indexed player, string name, Color color);
    event GameCreated(uint256 indexed gameId, address indexed creator);
    event PlayerJoinedGame(uint256 indexed gameId, address indexed player, Color color);
    event GameStarted(uint256 indexed gameId, uint256 playerCount);
    event DiceRolled(uint256 indexed gameId, address indexed player, uint256 diceValue);
    event PlayerMoved(uint256 indexed gameId, address indexed player, uint256 newPosition);
    event GameFinished(uint256 indexed gameId, address indexed winner, uint256 prizeAmount);
    event TokensStaked(address indexed player, uint256 amount);
    
    // Modifiers
    modifier onlyRegistered() {
        require(registeredPlayers[msg.sender], "Player not registered");
        _;
    }
    
    modifier gameExists(uint256 _gameId) {
        require(_gameId < gameCounter, "Game does not exist");
        _;
    }
    
    modifier gameActive(uint256 _gameId) {
        require(games[_gameId].state == GameState.ACTIVE, "Game is not active");
        _;
    }
    
    modifier playerTurn(uint256 _gameId) {
        Game storage game = games[_gameId];
        require(
            game.players[game.currentTurn].playerAddress == msg.sender,
            "Not your turn"
        );
        _;
    }
    
    modifier correctStake() {
        require(msg.value == STAKE_AMOUNT, "Incorrect stake amount");
        _;
    }
    
    /**
     * @dev Register a new player with name and color
     * @param _name Player's name
     * @param _color Player's chosen color (0=RED, 1=GREEN, 2=BLUE, 3=YELLOW)
     */
    function registerPlayer(string memory _name, uint8 _color) external {
        require(!registeredPlayers[msg.sender], "Player already registered");
        require(_color < 4, "Invalid color");
        require(bytes(_name).length > 0, "Name cannot be empty");
        
        registeredPlayers[msg.sender] = true;
        playerNames[msg.sender] = _name;
        playerColors[msg.sender] = Color(_color);
        
        emit PlayerRegistered(msg.sender, _name, Color(_color));
    }
    
    /**
     * @dev Create a new game
     */
    function createGame() external onlyRegistered returns (uint256) {
        require(playerToGame[msg.sender] == 0 || games[playerToGame[msg.sender]].state == GameState.FINISHED, 
                "Player already in active game");
        
        uint256 gameId = gameCounter++;
        Game storage newGame = games[gameId];
        
        newGame.gameId = gameId;
        newGame.playerCount = 0;
        newGame.state = GameState.WAITING;
        newGame.currentTurn = 0;
        newGame.prizePool = 0;
        newGame.createdAt = block.timestamp;
        
        emit GameCreated(gameId, msg.sender);
        return gameId;
    }
    
    /**
     * @dev Join an existing game with stake
     * @param _gameId The game ID to join
     */
    function joinGame(uint256 _gameId) 
        external 
        payable 
        onlyRegistered 
        gameExists(_gameId) 
        correctStake 
    {
        Game storage game = games[_gameId];
        require(game.state == GameState.WAITING, "Game not accepting players");
        require(game.playerCount < MAX_PLAYERS, "Game is full");
        require(playerToGame[msg.sender] == 0 || games[playerToGame[msg.sender]].state == GameState.FINISHED, 
                "Player already in active game");
        
        // Check if color is already taken
        Color playerColor = playerColors[msg.sender];
        for (uint256 i = 0; i < game.playerCount; i++) {
            require(game.players[i].color != playerColor, "Color already taken");
        }
        
        // Add player to game
        Player storage newPlayer = game.players[game.playerCount];
        newPlayer.playerAddress = msg.sender;
        newPlayer.name = playerNames[msg.sender];
        newPlayer.color = playerColor;
        newPlayer.position = 0;
        newPlayer.isRegistered = true;
        newPlayer.hasStaked = true;
        newPlayer.score = 0;
        
        game.playerCount++;
        game.prizePool += msg.value;
        playerToGame[msg.sender] = _gameId;
        totalStaked += msg.value;
        
        emit PlayerJoinedGame(_gameId, msg.sender, playerColor);
        emit TokensStaked(msg.sender, msg.value);
        
        // Start game if we have 4 players
        if (game.playerCount == MAX_PLAYERS) {
            game.state = GameState.ACTIVE;
            emit GameStarted(_gameId, game.playerCount);
        }
    }
    
    /**
     * @dev Roll dice and move player
     * @param _gameId The game ID
     */
    function rollDiceAndMove(uint256 _gameId) 
        external 
        gameExists(_gameId) 
        gameActive(_gameId) 
        playerTurn(_gameId) 
    {
        Game storage game = games[_gameId];
        
        // Generate dice roll (1-6)
        uint256 diceValue = _rollDice();
        
        emit DiceRolled(_gameId, msg.sender, diceValue);
        
        // Move player
        Player storage currentPlayer = game.players[game.currentTurn];
        uint256 newPosition = currentPlayer.position + diceValue;
        
        // Handle board wrap-around
        if (newPosition >= BOARD_SIZE) {
            newPosition = newPosition - BOARD_SIZE;
            currentPlayer.score += 10; // Bonus for completing a lap
        }
        
        currentPlayer.position = newPosition;
        currentPlayer.score += diceValue;
        
        emit PlayerMoved(_gameId, msg.sender, newPosition);
        
        // Check for win condition (simplified: first to complete 3 laps)
        if (currentPlayer.score >= 150) {
            _finishGame(_gameId, msg.sender);
            return;
        }
        
        // Move to next player's turn
        game.currentTurn = (game.currentTurn + 1) % game.playerCount;
    }
    
    /**
     * @dev Internal function to generate dice roll
     * @return Random number between 1 and 6
     */
    function _rollDice() private view returns (uint256) {
        return (uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            msg.sender,
            block.number
        ))) % 6) + 1;
    }
    
    /**
     * @dev Internal function to finish game and distribute prize
     * @param _gameId The game ID
     * @param _winner The winner's address
     */
    function _finishGame(uint256 _gameId, address _winner) private {
        Game storage game = games[_gameId];
        game.state = GameState.FINISHED;
        game.winner = _winner;
        
        uint256 prizeAmount = game.prizePool;
        game.prizePool = 0;
        
        // Update winner's total score
        playerScores[_winner] += 100; // Bonus for winning
        
        // Transfer prize to winner
        (bool success, ) = payable(_winner).call{value: prizeAmount}("");
        require(success, "Prize transfer failed");
        
        emit GameFinished(_gameId, _winner, prizeAmount);
    }
    
    /**
     * @dev Get game information
     * @param _gameId The game ID
     */
    function getGameInfo(uint256 _gameId) 
        external 
        view 
        gameExists(_gameId) 
        returns (
            uint256 gameId,
            uint256 playerCount,
            GameState state,
            uint256 currentTurn,
            uint256 prizePool,
            address winner
        ) 
    {
        Game storage game = games[_gameId];
        return (
            game.gameId,
            game.playerCount,
            game.state,
            game.currentTurn,
            game.prizePool,
            game.winner
        );
    }
    
    /**
     * @dev Get player information in a game
     * @param _gameId The game ID
     * @param _playerIndex The player index (0-3)
     */
    function getPlayerInGame(uint256 _gameId, uint256 _playerIndex) 
        external 
        view 
        gameExists(_gameId) 
        returns (
            address playerAddress,
            string memory name,
            Color color,
            uint256 position,
            uint256 score
        ) 
    {
        require(_playerIndex < games[_gameId].playerCount, "Player index out of bounds");
        Player storage player = games[_gameId].players[_playerIndex];
        return (
            player.playerAddress,
            player.name,
            player.color,
            player.position,
            player.score
        );
    }
    
    /**
     * @dev Get player's registration info
     * @param _player The player's address
     */
    function getPlayerInfo(address _player) 
        external 
        view 
        returns (
            bool isRegistered,
            string memory name,
            Color color,
            uint256 totalScore
        ) 
    {
        return (
            registeredPlayers[_player],
            playerNames[_player],
            playerColors[_player],
            playerScores[_player]
        );
    }
    
  
    function getTotalGames() external view returns (uint256) {
        return gameCounter;
    }
    
   
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
