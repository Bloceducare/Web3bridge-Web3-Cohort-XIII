// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// Simple ERC20 token for the game
contract LudoToken is ERC20, Ownable {
    constructor() ERC20("Ludo Game Token", "LUDO") Ownable(msg.sender) {
        _mint(msg.sender, 1000000 * 10**decimals()); // Initial supply
    }

        
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
    
    // Update the faucet function in LudoToken.sol
    function faucet() public {
        uint256 faucetAmount = 50 * 10**decimals();
        uint256 maxBalance = 100 * 10**decimals();
        
        require(balanceOf(msg.sender) < maxBalance, "Already have enough tokens");
        _mint(msg.sender, faucetAmount);
    }
}

contract LudoGame {
    LudoToken public immutable ludoToken;
    
    enum Color { RED, GREEN, BLUE, YELLOW }
    enum GameState { WAITING, ACTIVE, FINISHED }
    
    struct Player {
        address playerAddress;
        string name;
        Color color;
        uint256 score;
        uint256 position; // Position on the board (0-51, with special home positions)
        bool isRegistered;
        bool hasFinished;
    }
    
    struct Game {
        uint256 gameId;
        Player[4] players;
        uint256 playerCount;
        GameState state;
        uint256 currentPlayerIndex;
        uint256 stakeAmount;
        address winner;
        uint256 createdAt;
        bool[4] colorsTaken; // RED, GREEN, BLUE, YELLOW
    }
    
    mapping(uint256 => Game) public games;
    mapping(address => uint256) public playerCurrentGame;
    uint256 public gameCounter;
    
    // Dice rolling variables
    uint256 private nonce;
    
    event GameCreated(uint256 indexed gameId, address creator, uint256 stakeAmount);
    event PlayerJoined(uint256 indexed gameId, address player, string name, Color color);
    event GameStarted(uint256 indexed gameId);
    event DiceRolled(uint256 indexed gameId, address player, uint256 diceValue);
    event PlayerMoved(uint256 indexed gameId, address player, uint256 newPosition);
    event GameFinished(uint256 indexed gameId, address winner, uint256 prize);
    
    constructor(address _ludoToken) {
        ludoToken = LudoToken(_ludoToken);
    }
    
    modifier validGame(uint256 gameId) {
        require(gameId < gameCounter, "Invalid game ID");
        _;
    }
    
    modifier onlyGamePlayer(uint256 gameId) {
        require(playerCurrentGame[msg.sender] == gameId, "Not a player in this game");
        _;
    }
    
    modifier gameInState(uint256 gameId, GameState requiredState) {
        require(games[gameId].state == requiredState, "Game not in required state");
        _;
    }
    
    /**
     * @dev Create a new game with stake amount
     */
    function createGame(uint256 stakeAmount, string memory playerName) external returns (uint256) {
        require(stakeAmount > 0, "Stake must be greater than 0");
        require(bytes(playerName).length > 0, "Name cannot be empty");
        require(playerCurrentGame[msg.sender] == 0 || games[playerCurrentGame[msg.sender]].state == GameState.FINISHED, 
                "Already in an active game");
        
        ludoToken.transferFrom(msg.sender, address(this), stakeAmount);
        
        uint256 gameId = gameCounter++;
        Game storage game = games[gameId];
        
        game.gameId = gameId;
        game.playerCount = 1;
        game.state = GameState.WAITING;
        game.stakeAmount = stakeAmount;
        game.createdAt = block.timestamp;
        
        // Add creator as first player with RED color
        game.players[0] = Player({
            playerAddress: msg.sender,
            name: playerName,
            color: Color.RED,
            score: 0,
            position: 0,
            isRegistered: true,
            hasFinished: false
        });
        
        game.colorsTaken[0] = true; // RED taken
        playerCurrentGame[msg.sender] = gameId;
        
        emit GameCreated(gameId, msg.sender, stakeAmount);
        emit PlayerJoined(gameId, msg.sender, playerName, Color.RED);
        
        return gameId;
    }
    
    /**
     * @dev Join an existing game
     */
    function joinGame(uint256 gameId, string memory playerName, Color color) 
        external 
        validGame(gameId) 
        gameInState(gameId, GameState.WAITING) 
    {
        Game storage game = games[gameId];
        require(game.playerCount < 4, "Game is full");
        require(bytes(playerName).length > 0, "Name cannot be empty");
        require(!game.colorsTaken[uint256(color)], "Color already taken");
        require(playerCurrentGame[msg.sender] == 0 || games[playerCurrentGame[msg.sender]].state == GameState.FINISHED, 
                "Already in an active game");
        
        ludoToken.transferFrom(msg.sender, address(this), game.stakeAmount);
        
        uint256 playerIndex = game.playerCount;
        game.players[playerIndex] = Player({
            playerAddress: msg.sender,
            name: playerName,
            color: color,
            score: 0,
            position: 0,
            isRegistered: true,
            hasFinished: false
        });
        
        game.colorsTaken[uint256(color)] = true;
        game.playerCount++;
        playerCurrentGame[msg.sender] = gameId;
        
        emit PlayerJoined(gameId, msg.sender, playerName, color);
        
        // Auto-start if 4 players
        if (game.playerCount == 4) {
            _startGame(gameId);
        }
    }
    
    /**
     * @dev Start the game (can be called by any player when at least 2 players)
     */
    function startGame(uint256 gameId) 
        external 
        validGame(gameId) 
        onlyGamePlayer(gameId)
        gameInState(gameId, GameState.WAITING) 
    {
        Game storage game = games[gameId];
        require(game.playerCount >= 2, "Need at least 2 players to start");
        _startGame(gameId);
    }
    
    function _startGame(uint256 gameId) internal {
        games[gameId].state = GameState.ACTIVE;
        games[gameId].currentPlayerIndex = 0;
        emit GameStarted(gameId);
    }
    
    /**
     * @dev Roll dice and move (combined function for simplicity)
     */
    function rollDiceAndMove(uint256 gameId) 
        external 
        validGame(gameId) 
        onlyGamePlayer(gameId)
        gameInState(gameId, GameState.ACTIVE) 
    {
        Game storage game = games[gameId];
        require(game.players[game.currentPlayerIndex].playerAddress == msg.sender, 
                "Not your turn");
        
        // Roll dice
        uint256 diceValue = _rollDice();
        emit DiceRolled(gameId, msg.sender, diceValue);
        
        // Move player
        Player storage currentPlayer = game.players[game.currentPlayerIndex];
        uint256 newPosition = currentPlayer.position + diceValue;
        
        // Simple winning condition: reach position 52 or higher
        if (newPosition >= 52) {
            newPosition = 52; // Home position
            currentPlayer.hasFinished = true;
            currentPlayer.score += 100; // Bonus for finishing
            
            // Check if this player wins
            if (!_hasWinner(gameId)) {
                _endGame(gameId, msg.sender);
                return;
            }
        }
        
        currentPlayer.position = newPosition;
        currentPlayer.score += diceValue; // Score based on movement
        
        emit PlayerMoved(gameId, msg.sender, newPosition);
        
        // Move to next player
        _nextTurn(gameId);
    }
    
    /**
     * @dev Generate random dice roll (1-6)
     */
    function _rollDice() internal returns (uint256) {
        nonce++;
        uint256 randomValue = uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            msg.sender,
            nonce
        ))) % 6;
        return randomValue + 1; // 1-6
    }
    
    function _nextTurn(uint256 gameId) internal {
        Game storage game = games[gameId];
        
        // Find next active player
        uint256 nextPlayer = (game.currentPlayerIndex + 1) % game.playerCount;
        
        // Skip finished players
        uint256 attempts = 0;
        while (game.players[nextPlayer].hasFinished && attempts < 4) {
            nextPlayer = (nextPlayer + 1) % game.playerCount;
            attempts++;
        }
        
        game.currentPlayerIndex = nextPlayer;
        
        // Check if only one player remains
        uint256 activePlayers = 0;
        address lastActivePlayer;
        for (uint256 i = 0; i < game.playerCount; i++) {
            if (!game.players[i].hasFinished) {
                activePlayers++;
                lastActivePlayer = game.players[i].playerAddress;
            }
        }
        
        if (activePlayers <= 1 && lastActivePlayer != address(0)) {
            _endGame(gameId, lastActivePlayer);
        }
    }
    
    function _hasWinner(uint256 gameId) internal view returns (bool) {
        return games[gameId].winner != address(0);
    }
    
    function _endGame(uint256 gameId, address winner) internal {
        Game storage game = games[gameId];
        game.state = GameState.FINISHED;
        game.winner = winner;
        
        // Transfer all staked tokens to winner
        uint256 totalPrize = game.stakeAmount * game.playerCount;
        ludoToken.transfer(winner, totalPrize);
        
        emit GameFinished(gameId, winner, totalPrize);
    }
    
    /**
     * @dev Emergency function to leave game before it starts
     */
    function leaveGame(uint256 gameId) 
        external 
        validGame(gameId) 
        onlyGamePlayer(gameId)
        gameInState(gameId, GameState.WAITING) 
    {
        Game storage game = games[gameId];
        
        // Find and remove player
        for (uint256 i = 0; i < game.playerCount; i++) {
            if (game.players[i].playerAddress == msg.sender) {
                // Refund stake
                ludoToken.transfer(msg.sender, game.stakeAmount);
                
                // Reset color availability
                game.colorsTaken[uint256(game.players[i].color)] = false;
                
                // Shift remaining players
                for (uint256 j = i; j < game.playerCount - 1; j++) {
                    game.players[j] = game.players[j + 1];
                }
                
                game.playerCount--;
                playerCurrentGame[msg.sender] = 0;
                
                // If no players left, mark as finished
                if (game.playerCount == 0) {
                    game.state = GameState.FINISHED;
                }
                
                break;
            }
        }
    }
    
    // View functions
    function getGame(uint256 gameId) external view validGame(gameId) returns (
        uint256 id,
        uint256 playerCount,
        GameState state,
        uint256 currentPlayerIndex,
        uint256 stakeAmount,
        address winner,
        bool[4] memory colorsTaken
    ) {
        Game storage game = games[gameId];
        return (
            game.gameId,
            game.playerCount,
            game.state,
            game.currentPlayerIndex,
            game.stakeAmount,
            game.winner,
            game.colorsTaken
        );
    }
    
    function getPlayer(uint256 gameId, uint256 playerIndex) external view validGame(gameId) returns (
        address playerAddress,
        string memory name,
        Color color,
        uint256 score,
        uint256 position,
        bool hasFinished
    ) {
        require(playerIndex < games[gameId].playerCount, "Invalid player index");
        Player storage player = games[gameId].players[playerIndex];
        return (
            player.playerAddress,
            player.name,
            player.color,
            player.score,
            player.position,
            player.hasFinished
        );
    }
    
    function getMyGame() external view returns (uint256) {
        return playerCurrentGame[msg.sender];
    }
    
    function isMyTurn(uint256 gameId) external view validGame(gameId) returns (bool) {
        Game storage game = games[gameId];
        if (game.state != GameState.ACTIVE) return false;
        return game.players[game.currentPlayerIndex].playerAddress == msg.sender;
    }
    
    function getAvailableColors(uint256 gameId) external view validGame(gameId) returns (Color[] memory) {
        Game storage game = games[gameId];
        Color[] memory available = new Color[](4);
        uint256 count = 0;
        
        for (uint256 i = 0; i < 4; i++) {
            if (!game.colorsTaken[i]) {
                available[count] = Color(i);
                count++;
            }
        }
        
        // Resize array
        Color[] memory result = new Color[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = available[i];
        }
        
        return result;
    }
    
    /**
     * @dev Get all waiting games that can be joined
     */
    function getWaitingGames() external view returns (uint256[] memory) {
        uint256[] memory waitingGames = new uint256[](gameCounter);
        uint256 count = 0;
        
        for (uint256 i = 0; i < gameCounter; i++) {
            if (games[i].state == GameState.WAITING && games[i].playerCount < 4) {
                waitingGames[count] = i;
                count++;
            }
        }
        
        // Resize array
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = waitingGames[i];
        }
        
        return result;
    }
}