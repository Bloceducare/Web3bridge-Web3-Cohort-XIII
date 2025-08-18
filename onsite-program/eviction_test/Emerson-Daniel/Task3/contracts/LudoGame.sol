pragma solidity ^0.8.24;

import "./GameToken.sol";

contract LudoGame {
    enum Color { RED, GREEN, BLUE, YELLOW }
    enum GameState { WAITING, ACTIVE, FINISHED }
    
    struct Player {
        string name;
        address playerAddress;
        Color color;
        uint256 score;
        uint256 position;
        bool isRegistered;
        bool hasStaked;
    }
    
    GameToken public gameToken;
    uint256 public constant STAKE_AMOUNT = 10 * 10**18;
    uint256 public constant MAX_PLAYERS = 4;
    uint256 public constant BOARD_SIZE = 52;
    uint256 public constant WINNING_POSITION = 51;
    
    mapping(address => Player) public players;
    mapping(Color => bool) public colorTaken;
    address[] public playerAddresses;
    
    GameState public gameState;
    address public winner;
    uint256 public totalStaked;
    uint256 public currentPlayerIndex;
    
    event PlayerRegistered(address indexed player, string name, Color color);
    event PlayerStaked(address indexed player, uint256 amount);
    event GameStarted();
    event DiceRolled(address indexed player, uint256 diceValue);
    event PlayerMoved(address indexed player, uint256 newPosition);
    event GameWon(address indexed winner, uint256 prize);
    
    modifier onlyRegistered() {
        require(players[msg.sender].isRegistered, "Player not registered");
        _;
    }
    
    modifier gameInState(GameState _state) {
        require(gameState == _state, "Invalid game state");
        _;
    }
    
    modifier onlyCurrentPlayer() {
        require(msg.sender == playerAddresses[currentPlayerIndex], "Not your turn");
        _;
    }
    
    constructor(address _gameToken) {
        gameToken = GameToken(_gameToken);
        gameState = GameState.WAITING;
    }
    
    function registerPlayer(string memory _name, Color _color) external {
        require(!players[msg.sender].isRegistered, "Already registered");
        require(playerAddresses.length < MAX_PLAYERS, "Game is full");
        require(!colorTaken[_color], "Color already taken");
        require(bytes(_name).length > 0, "Name cannot be empty");
        
        players[msg.sender] = Player({
            name: _name,
            playerAddress: msg.sender,
            color: _color,
            score: 0,
            position: 0,
            isRegistered: true,
            hasStaked: false
        });
        
        colorTaken[_color] = true;
        playerAddresses.push(msg.sender);
        
        emit PlayerRegistered(msg.sender, _name, _color);
    }
    
    function stakeTokens() external onlyRegistered gameInState(GameState.WAITING) {
        require(!players[msg.sender].hasStaked, "Already staked");
        require(gameToken.transferFrom(msg.sender, address(this), STAKE_AMOUNT), "Stake transfer failed");
        
        players[msg.sender].hasStaked = true;
        totalStaked += STAKE_AMOUNT;
        
        emit PlayerStaked(msg.sender, STAKE_AMOUNT);
        
        if (allPlayersStaked()) {
            gameState = GameState.ACTIVE;
            emit GameStarted();
        }
    }
    
    function rollDice() external onlyRegistered gameInState(GameState.ACTIVE) onlyCurrentPlayer returns (uint256) {
        uint256 diceValue = generateRandomNumber() % 6 + 1;
        
        emit DiceRolled(msg.sender, diceValue);
        
        movePlayer(diceValue);
        
        nextPlayer();
        
        return diceValue;
    }
    
    function movePlayer(uint256 _diceValue) internal {
        Player storage player = players[msg.sender];
        uint256 newPosition = player.position + _diceValue;
        
        if (newPosition >= WINNING_POSITION) {
            newPosition = WINNING_POSITION;
            player.position = newPosition;
            player.score += 100;
            
            winner = msg.sender;
            gameState = GameState.FINISHED;
            
            uint256 prize = totalStaked;
            totalStaked = 0;
            
            require(gameToken.transfer(winner, prize), "Prize transfer failed");
            
            emit GameWon(winner, prize);
        } else {
            player.position = newPosition;
            player.score += _diceValue;
        }
        
        emit PlayerMoved(msg.sender, player.position);
    }
    
    function generateRandomNumber() internal view returns (uint256) {
        return uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            msg.sender,
            playerAddresses.length
        )));
    }
    
    function nextPlayer() internal {
        if (gameState == GameState.ACTIVE) {
            currentPlayerIndex = (currentPlayerIndex + 1) % playerAddresses.length;
        }
    }
    
    function allPlayersStaked() internal view returns (bool) {
        for (uint256 i = 0; i < playerAddresses.length; i++) {
            if (!players[playerAddresses[i]].hasStaked) {
                return false;
            }
        }
        return playerAddresses.length > 0;
    }
    
    function getCurrentPlayer() external view returns (address) {
        if (playerAddresses.length == 0) return address(0);
        return playerAddresses[currentPlayerIndex];
    }
    
    function getPlayerInfo(address _player) external view returns (
        string memory name,
        Color color,
        uint256 score,
        uint256 position,
        bool isRegistered,
        bool hasStaked
    ) {
        Player memory player = players[_player];
        return (
            player.name,
            player.color,
            player.score,
            player.position,
            player.isRegistered,
            player.hasStaked
        );
    }
    
    function getGameInfo() external view returns (
        GameState state,
        uint256 playersCount,
        uint256 stakedAmount,
        address currentPlayer,
        address gameWinner
    ) {
        return (
            gameState,
            playerAddresses.length,
            totalStaked,
            playerAddresses.length > 0 ? playerAddresses[currentPlayerIndex] : address(0),
            winner
        );
    }
    
    function resetGame() external {
        require(gameState == GameState.FINISHED, "Game not finished");
        
        for (uint256 i = 0; i < playerAddresses.length; i++) {
            address playerAddr = playerAddresses[i];
            colorTaken[players[playerAddr].color] = false;
            delete players[playerAddr];
        }
        
        delete playerAddresses;
        gameState = GameState.WAITING;
        winner = address(0);
        totalStaked = 0;
        currentPlayerIndex = 0;
    }
}
