pragma solidity ^0.8.19;

import "./LudoToken.sol";

contract LudoGame {
    LudoToken public gameToken;
    
    enum Color { RED, GREEN, BLUE, YELLOW }
    enum GameState { WAITING, ACTIVE, FINISHED }
    
    struct Player {
        address playerAddress;
        string name;
        Color color;
        uint256 score;
        bool isRegistered;
        bool hasStaked;
        uint256[4] piecePositions;
        uint256 piecesHome;
    }
    
    struct Game {
        uint256 gameId;
        Player[4] players;
        uint256 playerCount;
        uint256 currentPlayerIndex;
        GameState state;
        uint256 stakeAmount;
        uint256 totalPrize;
        address winner;
        uint256 createdAt;
    }
    
    mapping(uint256 => Game) public games;
    mapping(address => uint256) public playerCurrentGame;
    mapping(Color => bool) public colorTaken;
    
    uint256 public gameCounter;
    uint256 public constant STAKE_AMOUNT = 100 * 10**18;
    uint256 public constant BOARD_SIZE = 52;
    uint256 public constant HOME_POSITION = 57;
    
    event PlayerRegistered(uint256 indexed gameId, address indexed player, string name, Color color);
    event GameStarted(uint256 indexed gameId, uint256 playerCount);
    event DiceRolled(uint256 indexed gameId, address indexed player, uint256 diceValue);
    event PieceMoved(uint256 indexed gameId, address indexed player, uint256 pieceIndex, uint256 newPosition);
    event GameFinished(uint256 indexed gameId, address indexed winner, uint256 prize);
    event PlayerStaked(uint256 indexed gameId, address indexed player, uint256 amount);
    
    constructor(address _tokenAddress) {
        gameToken = LudoToken(_tokenAddress);
    }
    
    function createGame() external returns (uint256) {
        gameCounter++;
        
        Game storage newGame = games[gameCounter];
        newGame.gameId = gameCounter;
        newGame.state = GameState.WAITING;
        newGame.stakeAmount = STAKE_AMOUNT;
        newGame.createdAt = block.timestamp;
        
        return gameCounter;
    }
    
    function registerPlayer(uint256 _gameId, string memory _name, Color _color) external {
        require(_gameId > 0 && _gameId <= gameCounter, "Invalid game ID");
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(!colorTaken[_color], "Color already taken");
        
        Game storage game = games[_gameId];
        require(game.state == GameState.WAITING, "Game not in waiting state");
        require(game.playerCount < 4, "Game is full");
        require(playerCurrentGame[msg.sender] == 0, "Player already in a game");

        for (uint256 i = 0; i < game.playerCount; i++) {
            require(game.players[i].playerAddress != msg.sender, "Already registered");
        }
        
        Player storage newPlayer = game.players[game.playerCount];
        newPlayer.playerAddress = msg.sender;
        newPlayer.name = _name;
        newPlayer.color = _color;
        newPlayer.isRegistered = true;

        for (uint256 i = 0; i < 4; i++) {
            newPlayer.piecePositions[i] = 0;
        }
        
        colorTaken[_color] = true;
        game.playerCount++;
        playerCurrentGame[msg.sender] = _gameId;
        
        emit PlayerRegistered(_gameId, msg.sender, _name, _color);
    }
    
    function stakeTokens(uint256 _gameId) external {
        require(_gameId > 0 && _gameId <= gameCounter, "Invalid game ID");
        
        Game storage game = games[_gameId];
        require(game.state == GameState.WAITING, "Game not in waiting state");

        bool playerFound = false;
        uint256 playerIndex;
        for (uint256 i = 0; i < game.playerCount; i++) {
            if (game.players[i].playerAddress == msg.sender) {
                playerFound = true;
                playerIndex = i;
                break;
            }
        }
        
        require(playerFound, "Player not registered in this game");
        require(!game.players[playerIndex].hasStaked, "Already staked");
        require(gameToken.balanceOf(msg.sender) >= STAKE_AMOUNT, "Insufficient token balance");

        require(gameToken.transferFrom(msg.sender, address(this), STAKE_AMOUNT), "Token transfer failed");
        
        game.players[playerIndex].hasStaked = true;
        game.totalPrize += STAKE_AMOUNT;
        
        emit PlayerStaked(_gameId, msg.sender, STAKE_AMOUNT);

        bool allStaked = true;
        for (uint256 i = 0; i < game.playerCount; i++) {
            if (!game.players[i].hasStaked) {
                allStaked = false;
                break;
            }
        }
        
        if (allStaked && game.playerCount >= 2) {
            startGame(_gameId);
        }
    }
    
    function startGame(uint256 _gameId) internal {
        Game storage game = games[_gameId];
        game.state = GameState.ACTIVE;
        game.currentPlayerIndex = 0;
        
        emit GameStarted(_gameId, game.playerCount);
    }
    
    function rollDice(uint256 _gameId) external returns (uint256) {
        require(_gameId > 0 && _gameId <= gameCounter, "Invalid game ID");
        
        Game storage game = games[_gameId];
        require(game.state == GameState.ACTIVE, "Game not active");
        require(game.players[game.currentPlayerIndex].playerAddress == msg.sender, "Not your turn");
        
        uint256 diceValue = generateRandomDice();
        
        emit DiceRolled(_gameId, msg.sender, diceValue);
        
        return diceValue;
    }
    
    function generateRandomDice() internal view returns (uint256) {
        uint256 randomHash = uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            msg.sender,
            block.number
        )));
        return (randomHash % 6) + 1;
    }
    
    function movePiece(uint256 _gameId, uint256 _pieceIndex, uint256 _diceValue) external {
        require(_gameId > 0 && _gameId <= gameCounter, "Invalid game ID");
        require(_pieceIndex < 4, "Invalid piece index");
        
        Game storage game = games[_gameId];
        require(game.state == GameState.ACTIVE, "Game not active");
        require(game.players[game.currentPlayerIndex].playerAddress == msg.sender, "Not your turn");
        
        Player storage currentPlayer = game.players[game.currentPlayerIndex];
        uint256 currentPosition = currentPlayer.piecePositions[_pieceIndex];
        uint256 newPosition;

        if (currentPosition == 0 && _diceValue == 6) {
            newPosition = getStartPosition(currentPlayer.color);
        } else if (currentPosition == 0) {
            revert("Need 6 to bring piece to board");
        } else {
            newPosition = currentPosition + _diceValue;

            if (newPosition >= BOARD_SIZE) {
                newPosition = HOME_POSITION;
                currentPlayer.piecesHome++;
            }
        }
        
        currentPlayer.piecePositions[_pieceIndex] = newPosition;
        currentPlayer.score += _diceValue;
        
        emit PieceMoved(_gameId, msg.sender, _pieceIndex, newPosition);

        if (currentPlayer.piecesHome == 4) {
            finishGame(_gameId, msg.sender);
            return;
        }

        if (_diceValue != 6) {
            game.currentPlayerIndex = (game.currentPlayerIndex + 1) % game.playerCount;
        }
    }
    
    function getStartPosition(Color _color) internal pure returns (uint256) {
        if (_color == Color.RED) return 1;
        if (_color == Color.GREEN) return 14;
        if (_color == Color.BLUE) return 27;
        if (_color == Color.YELLOW) return 40;
        return 1;
    }
    
    function finishGame(uint256 _gameId, address _winner) internal {
        Game storage game = games[_gameId];
        game.state = GameState.FINISHED;
        game.winner = _winner;

        require(gameToken.transfer(_winner, game.totalPrize), "Prize transfer failed");

        for (uint256 i = 0; i < game.playerCount; i++) {
            playerCurrentGame[game.players[i].playerAddress] = 0;
        }
        
        emit GameFinished(_gameId, _winner, game.totalPrize);
    }
    
    function getGameInfo(uint256 _gameId) external view returns (
        uint256 gameId,
        uint256 playerCount,
        GameState state,
        uint256 totalPrize,
        address winner
    ) {
        Game storage game = games[_gameId];
        return (
            game.gameId,
            game.playerCount,
            game.state,
            game.totalPrize,
            game.winner
        );
    }
    
    function getPlayerInfo(uint256 _gameId, uint256 _playerIndex) external view returns (
        address playerAddress,
        string memory name,
        Color color,
        uint256 score,
        bool hasStaked,
        uint256[4] memory piecePositions,
        uint256 piecesHome
    ) {
        require(_playerIndex < games[_gameId].playerCount, "Invalid player index");
        
        Player storage player = games[_gameId].players[_playerIndex];
        return (
            player.playerAddress,
            player.name,
            player.color,
            player.score,
            player.hasStaked,
            player.piecePositions,
            player.piecesHome
        );
    }
    
    function getCurrentPlayer(uint256 _gameId) external view returns (address) {
        Game storage game = games[_gameId];
        if (game.state != GameState.ACTIVE) return address(0);
        return game.players[game.currentPlayerIndex].playerAddress;
    }
}
