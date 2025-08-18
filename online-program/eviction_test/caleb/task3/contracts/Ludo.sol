// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

// Ludo Token Contract
contract LudoToken is ERC20, Ownable {
    constructor() ERC20("Ludo Token", "LUDO") {
        _mint(msg.sender, 1000000 * 10**decimals()); 
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    function faucet() public {
        require(balanceOf(msg.sender) < 1000 * 10**decimals(), "You already have enough tokens");
        _mint(msg.sender, 100 * 10**decimals()); // Give 100 tokens from faucet
    }
}

// Main Ludo Game Contract
contract LudoGame is ReentrancyGuard {
    enum Color { RED, GREEN, BLUE, YELLOW }
    enum GameState { WAITING_FOR_PLAYERS, IN_PROGRESS, FINISHED }
    
    struct Player {
        address playerAddress;
        string name;
        Color color;
        uint256 score;
        bool isRegistered;
        uint256[4] tokenPositions; // Position of 4 tokens (0-56, where 0 is home)
        bool[4] tokensInHome; // Track if tokens are in home area
        bool[4] tokensFinished; // Track if tokens reached finish
    }

    struct Game {
        uint256 gameId;
        Player[4] players;
        uint8 playerCount;
        uint8 currentPlayerIndex;
        GameState state;
        uint256 stakeAmount;
        uint256 totalPot;
        address winner;
        uint256 createdAt;
        bool[4] colorTaken; // Track which colors are taken
    }

    LudoToken public ludoToken;
    
    mapping(uint256 => Game) public games;
    mapping(address => uint256) public playerCurrentGame;
    mapping(address => Player) public registeredPlayers;
    
    uint256 public gameCounter;
    uint256 public constant STAKE_AMOUNT = 10 * 10**18; // 10 LUDO tokens
    uint256 public constant BOARD_SIZE = 56; // Total positions on board
    uint256 public constant HOME_STRETCH_START = 51; // Where home stretch begins
    
    // Events
    event PlayerRegistered(address indexed player, string name, Color color);
    event GameCreated(uint256 indexed gameId, address indexed creator);
    event PlayerJoinedGame(uint256 indexed gameId, address indexed player, Color color);
    event GameStarted(uint256 indexed gameId);
    event DiceRolled(uint256 indexed gameId, address indexed player, uint8 diceValue);
    event TokenMoved(uint256 indexed gameId, address indexed player, uint8 tokenIndex, uint256 newPosition);
    event GameFinished(uint256 indexed gameId, address indexed winner, uint256 prize);
    
    // Custom errors
    error PlayerAlreadyRegistered();
    error PlayerNotRegistered();
    error GameFull();
    error GameNotInProgress();
    error NotYourTurn();
    error InsufficientStake();
    error ColorAlreadyTaken();
    error InvalidMove();
    
    constructor(address _ludoToken) {
        ludoToken = LudoToken(_ludoToken);
    }

    // Player registration
    function registerPlayer(string memory _name, Color _color) external {
        if (registeredPlayers[msg.sender].isRegistered) {
            revert PlayerAlreadyRegistered();
        }
        
        registeredPlayers[msg.sender] = Player({
            playerAddress: msg.sender,
            name: _name,
            color: _color,
            score: 0,
            isRegistered: true,
            tokenPositions: [uint256(0), 0, 0, 0],
            tokensInHome: [true, true, true, true],
            tokensFinished: [false, false, false, false]
        });
        
        emit PlayerRegistered(msg.sender, _name, _color);
    }

    // Create a new game
    function createGame() external returns (uint256) {
        if (!registeredPlayers[msg.sender].isRegistered) {
            revert PlayerNotRegistered();
        }
        
        gameCounter++;
        uint256 gameId = gameCounter;
        
        Game storage newGame = games[gameId];
        newGame.gameId = gameId;
        newGame.playerCount = 1;
        newGame.currentPlayerIndex = 0;
        newGame.state = GameState.WAITING_FOR_PLAYERS;
        newGame.stakeAmount = STAKE_AMOUNT;
        newGame.totalPot = STAKE_AMOUNT;
        newGame.createdAt = block.timestamp;
        
        // Add creator as first player
        Player memory creator = registeredPlayers[msg.sender];
        newGame.players[0] = creator;
        newGame.colorTaken[uint8(creator.color)] = true;
        
        playerCurrentGame[msg.sender] = gameId;
        
        // Transfer stake
        require(ludoToken.transferFrom(msg.sender, address(this), STAKE_AMOUNT), "Stake transfer failed");
        
        emit GameCreated(gameId, msg.sender);
        emit PlayerJoinedGame(gameId, msg.sender, creator.color);
        
        return gameId;
    }

    // Join an existing game
    function joinGame(uint256 _gameId) external {
        if (!registeredPlayers[msg.sender].isRegistered) {
            revert PlayerNotRegistered();
        }
        
        Game storage game = games[_gameId];
        
        if (game.playerCount >= 4) {
            revert GameFull();
        }
        
        if (game.state != GameState.WAITING_FOR_PLAYERS) {
            revert GameNotInProgress();
        }
        
        Player memory player = registeredPlayers[msg.sender];
        
        if (game.colorTaken[uint8(player.color)]) {
            revert ColorAlreadyTaken();
        }
        
        // Add player to game
        game.players[game.playerCount] = player;
        game.colorTaken[uint8(player.color)] = true;
        game.playerCount++;
        game.totalPot += STAKE_AMOUNT;
        
        playerCurrentGame[msg.sender] = _gameId;
        
        // Transfer stake
        require(ludoToken.transferFrom(msg.sender, address(this), STAKE_AMOUNT), "Stake transfer failed");
        
        emit PlayerJoinedGame(_gameId, msg.sender, player.color);
        
        // Start game if we have enough players (minimum 2)
        if (game.playerCount >= 2) {
            game.state = GameState.IN_PROGRESS;
            emit GameStarted(_gameId);
        }
    }

    // Dice rolling algorithm using block properties for randomness
    function rollDice(uint256 _gameId) external returns (uint8) {
        Game storage game = games[_gameId];
        
        if (game.state != GameState.IN_PROGRESS) {
            revert GameNotInProgress();
        }
        
        if (game.players[game.currentPlayerIndex].playerAddress != msg.sender) {
            revert NotYourTurn();
        }
        
        // Generate pseudo-random number between 1-6
        uint8 diceValue = uint8((uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.difficulty,
            msg.sender,
            _gameId
        ))) % 6) + 1);
        
        emit DiceRolled(_gameId, msg.sender, diceValue);
        
        return diceValue;
    }

    // Move a token
    function moveToken(uint256 _gameId, uint8 _tokenIndex, uint8 _diceValue) external {
        Game storage game = games[_gameId];
        
        if (game.state != GameState.IN_PROGRESS) {
            revert GameNotInProgress();
        }
        
        if (game.players[game.currentPlayerIndex].playerAddress != msg.sender) {
            revert NotYourTurn();
        }
        
        if (_tokenIndex > 3) {
            revert InvalidMove();
        }
        
        Player storage currentPlayer = game.players[game.currentPlayerIndex];
        
        // Check if token can move out of home (needs 6)
        if (currentPlayer.tokensInHome[_tokenIndex] && _diceValue != 6) {
            revert InvalidMove();
        }
        
        // Move token out of home
        if (currentPlayer.tokensInHome[_tokenIndex] && _diceValue == 6) {
            currentPlayer.tokensInHome[_tokenIndex] = false;
            currentPlayer.tokenPositions[_tokenIndex] = getStartPosition(currentPlayer.color);
        } else {
            // Regular move
            uint256 newPosition = currentPlayer.tokenPositions[_tokenIndex] + _diceValue;
            
            // Check if token reaches finish
            if (newPosition >= BOARD_SIZE) {
                currentPlayer.tokensFinished[_tokenIndex] = true;
                currentPlayer.tokenPositions[_tokenIndex] = BOARD_SIZE;
            } else {
                currentPlayer.tokenPositions[_tokenIndex] = newPosition;
            }
        }
        
        emit TokenMoved(_gameId, msg.sender, _tokenIndex, currentPlayer.tokenPositions[_tokenIndex]);
        
        // Check if player won
        if (checkPlayerWon(currentPlayer)) {
            game.state = GameState.FINISHED;
            game.winner = msg.sender;
            registeredPlayers[msg.sender].score++;
            
            // Transfer prize to winner
            require(ludoToken.transfer(msg.sender, game.totalPot), "Prize transfer failed");
            
            emit GameFinished(_gameId, msg.sender, game.totalPot);
        } else {
            // Move to next player (if dice wasn't 6)
            if (_diceValue != 6) {
                game.currentPlayerIndex = (game.currentPlayerIndex + 1) % game.playerCount;
            }
        }
    }

    // Helper function to get starting position for each color
    function getStartPosition(Color _color) internal pure returns (uint256) {
        if (_color == Color.RED) return 1;
        if (_color == Color.GREEN) return 14;
        if (_color == Color.BLUE) return 27;
        if (_color == Color.YELLOW) return 40;
        return 1;
    }

    // Check if a player has won (all 4 tokens finished)
    function checkPlayerWon(Player memory _player) internal pure returns (bool) {
        return _player.tokensFinished[0] && 
               _player.tokensFinished[1] && 
               _player.tokensFinished[2] && 
               _player.tokensFinished[3];
    }

    // View functions
    function getGame(uint256 _gameId) external view returns (Game memory) {
        return games[_gameId];
    }

    function getPlayer(address _playerAddress) external view returns (Player memory) {
        return registeredPlayers[_playerAddress];
    }

    function getCurrentGame(address _playerAddress) external view returns (uint256) {
        return playerCurrentGame[_playerAddress];
    }

    // Emergency function to end a game (owner only)
    function emergencyEndGame(uint256 _gameId) external {
        Game storage game = games[_gameId];
        require(game.state == GameState.IN_PROGRESS, "Game not in progress");
        require(block.timestamp > game.createdAt + 1 days, "Game too recent");
        
        game.state = GameState.FINISHED;
        
        // Refund stakes to all players
        for (uint8 i = 0; i < game.playerCount; i++) {
            ludoToken.transfer(game.players[i].playerAddress, STAKE_AMOUNT);
        }
    }
}
