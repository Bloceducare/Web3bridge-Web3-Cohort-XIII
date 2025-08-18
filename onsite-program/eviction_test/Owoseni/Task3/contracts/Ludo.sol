// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

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
        bool hasStaked;
    }
    
    struct Game {
        uint256 gameId;
        Player[4] players;
        uint8 playerCount;
        GameState state;
        uint256 currentPlayerIndex;
        uint256 stakeAmount;
        uint256 totalStaked;
        address winner;
        uint256 createdAt;
    }
    
    mapping(uint256 => Game) public games;
    mapping(address => uint256) public playerCurrentGame;
    uint256 public gameCounter;
    uint256 public constant MAX_PLAYERS = 4;
    uint256 public constant WINNING_POSITION = 100;
    
    event GameCreated(uint256 indexed gameId, address indexed creator, uint256 stakeAmount);
    event PlayerRegistered(uint256 indexed gameId, address indexed player, string name, Color color);
    event GameStarted(uint256 indexed gameId);
    event DiceRolled(uint256 indexed gameId, address indexed player, uint256 diceValue);
    event PlayerMoved(uint256 indexed gameId, address indexed player, uint256 newPosition);
    event GameFinished(uint256 indexed gameId, address indexed winner, uint256 prize);
    event TokensStaked(uint256 indexed gameId, address indexed player, uint256 amount);
    
    
    modifier gameExists(uint256 _gameId) {
        require(_gameId < gameCounter, "Game does not exist");
        _;
    }
    
    modifier playerInGame(uint256 _gameId) {
        require(playerCurrentGame[msg.sender] == _gameId, "Player not in this game");
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
    
    function createGame(uint256 _stakeAmount) external payable returns (uint256) {
        require(msg.value == _stakeAmount, "Must send exact stake amount");
        require(_stakeAmount > 0, "Stake amount must be greater than 0");
        
        uint256 gameId = gameCounter++;
        Game storage newGame = games[gameId];
        
        newGame.gameId = gameId;
        newGame.playerCount = 0;
        newGame.state = GameState.WAITING_FOR_PLAYERS;
        newGame.currentPlayerIndex = 0;
        newGame.stakeAmount = _stakeAmount;
        newGame.totalStaked = 0;
        newGame.createdAt = block.timestamp;
        
        emit GameCreated(gameId, msg.sender, _stakeAmount);
        return gameId;
    }
    
    function registerPlayer(uint256 _gameId, string memory _name, Color _color) 
        external 
        payable
        gameExists(_gameId) 
    {
        Game storage game = games[_gameId];
        require(game.state == GameState.WAITING_FOR_PLAYERS, "Game already started or finished");
        require(game.playerCount < MAX_PLAYERS, "Game is full");
        require(msg.value == game.stakeAmount, "Must stake required amount");
        require(playerCurrentGame[msg.sender] == 0 || playerCurrentGame[msg.sender] == _gameId, "Already in another game");
        require(bytes(_name).length > 0, "Name cannot be empty");
        
        for (uint8 i = 0; i < game.playerCount; i++) {
            require(game.players[i].color != _color, "Color already taken");
            require(game.players[i].playerAddress != msg.sender, "Already registered in this game");
        }
        
        Player storage newPlayer = game.players[game.playerCount];
        newPlayer.playerAddress = msg.sender;
        newPlayer.name = _name;
        newPlayer.color = _color;
        newPlayer.score = 0;
        newPlayer.isRegistered = true;
        newPlayer.position = 0;
        newPlayer.hasStaked = true;
        
        game.playerCount++;
        game.totalStaked += msg.value;
        playerCurrentGame[msg.sender] = _gameId;
        
        emit PlayerRegistered(_gameId, msg.sender, _name, _color);
        emit TokensStaked(_gameId, msg.sender, msg.value);
        
        if (game.playerCount == MAX_PLAYERS) {
            game.state = GameState.IN_PROGRESS;
            emit GameStarted(_gameId);
        }
    }
    
    function rollDice(uint256 _gameId) 
        external 
        gameExists(_gameId)
        playerInGame(_gameId)
        gameInProgress(_gameId)
        isCurrentPlayer(_gameId)
        returns (uint256) 
    {
        uint256 randomHash = uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            msg.sender,
            _gameId,
            block.number
        )));
        
        uint256 diceValue = (randomHash % 6) + 1;
        
        emit DiceRolled(_gameId, msg.sender, diceValue);
        
        _movePlayer(_gameId, diceValue);
        
        return diceValue;
    }
    
    function _movePlayer(uint256 _gameId, uint256 _diceValue) internal {
        Game storage game = games[_gameId];
        Player storage currentPlayer = game.players[game.currentPlayerIndex];
        
        uint256 newPosition = currentPlayer.position + _diceValue;
        
        if (newPosition >= WINNING_POSITION) {
            newPosition = WINNING_POSITION;
            currentPlayer.position = newPosition;
            currentPlayer.score += 100; 
            
            game.state = GameState.FINISHED;
            game.winner = currentPlayer.playerAddress;
            
            payable(currentPlayer.playerAddress).transfer(game.totalStaked);
            
            emit PlayerMoved(_gameId, currentPlayer.playerAddress, newPosition);
            emit GameFinished(_gameId, currentPlayer.playerAddress, game.totalStaked);
            
            for (uint8 i = 0; i < game.playerCount; i++) {
                delete playerCurrentGame[game.players[i].playerAddress];
            }
            
            return;
        }
        
        currentPlayer.position = newPosition;
        currentPlayer.score += _diceValue;
        
        emit PlayerMoved(_gameId, currentPlayer.playerAddress, newPosition);
        
        game.currentPlayerIndex = (game.currentPlayerIndex + 1) % game.playerCount;
    }
    
    function getGame(uint256 _gameId) external view gameExists(_gameId) returns (
        uint256 gameId,
        uint8 playerCount,
        GameState state,
        uint256 currentPlayerIndex,
        uint256 stakeAmount,
        uint256 totalStaked,
        address winner
    ) {
        Game storage game = games[_gameId];
        return (
            game.gameId,
            game.playerCount,
            game.state,
            game.currentPlayerIndex,
            game.stakeAmount,
            game.totalStaked,
            game.winner
        );
    }
    
    function getPlayer(uint256 _gameId, uint8 _playerIndex) external view gameExists(_gameId) returns (
        address playerAddress,
        string memory name,
        Color color,
        uint256 score,
        uint256 position,
        bool hasStaked
    ) {
        require(_playerIndex < games[_gameId].playerCount, "Player index out of bounds");
        Player storage player = games[_gameId].players[_playerIndex];
        return (
            player.playerAddress,
            player.name,
            player.color,
            player.score,
            player.position,
            player.hasStaked
        );
    }
    
    function getAllPlayers(uint256 _gameId) external view gameExists(_gameId) returns (
        address[] memory addresses,
        string[] memory names,
        Color[] memory colors,
        uint256[] memory scores,
        uint256[] memory positions
    ) {
        Game storage game = games[_gameId];
        uint8 count = game.playerCount;
        
        addresses = new address[](count);
        names = new string[](count);
        colors = new Color[](count);
        scores = new uint256[](count);
        positions = new uint256[](count);
        
        for (uint8 i = 0; i < count; i++) {
            addresses[i] = game.players[i].playerAddress;
            names[i] = game.players[i].name;
            colors[i] = game.players[i].color;
            scores[i] = game.players[i].score;
            positions[i] = game.players[i].position;
        }
        
        return (addresses, names, colors, scores, positions);
    }
    
    function getCurrentPlayer(uint256 _gameId) external view gameExists(_gameId) returns (
        address playerAddress,
        string memory name,
        Color color
    ) {
        Game storage game = games[_gameId];
        if (game.state != GameState.IN_PROGRESS) {
            return (address(0), "", Color.RED);
        }
        
        Player storage currentPlayer = game.players[game.currentPlayerIndex];
        return (currentPlayer.playerAddress, currentPlayer.name, currentPlayer.color);
    }
    
    function isColorAvailable(uint256 _gameId, Color _color) external view gameExists(_gameId) returns (bool) {
        Game storage game = games[_gameId];
        for (uint8 i = 0; i < game.playerCount; i++) {
            if (game.players[i].color == _color) {
                return false;
            }
        }
        return true;
    }
    
    function getAvailableColors(uint256 _gameId) external view gameExists(_gameId) returns (Color[] memory) {
        Game storage game = games[_gameId];
        bool[] memory taken = new bool[](4);
        
        for (uint8 i = 0; i < game.playerCount; i++) {
            taken[uint256(game.players[i].color)] = true;
        }
        
        uint8 availableCount = 0;
        for (uint8 i = 0; i < 4; i++) {
            if (!taken[i]) availableCount++;
        }
        
        Color[] memory available = new Color[](availableCount);
        uint8 index = 0;
        for (uint8 i = 0; i < 4; i++) {
            if (!taken[i]) {
                available[index] = Color(i);
                index++;
            }
        }
        
        return available;
    }
    
    function leaveGame(uint256 _gameId) external gameExists(_gameId) playerInGame(_gameId) {
        Game storage game = games[_gameId];
        require(game.state != GameState.FINISHED, "Game already finished");
        
        delete playerCurrentGame[msg.sender];
        
    }
    
    function getTotalGames() external view returns (uint256) {
        return gameCounter;
    }
    
    function getPlayerActiveGame() external view returns (uint256) {
        return playerCurrentGame[msg.sender];
    }
}