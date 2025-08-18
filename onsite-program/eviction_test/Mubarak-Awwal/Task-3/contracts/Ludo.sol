pragma solidity ^0.8.19;

interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

contract LudoToken is IERC20 {
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;
    
    uint256 private _totalSupply;
    string public name = "Ludo Game Token";
    string public symbol = "LUDO";
    uint8 public decimals = 18;
    address public owner;
    
    constructor() {
        owner = msg.sender;
        _totalSupply = 1000000 * 10**decimals;
        _balances[msg.sender] = _totalSupply;
    }
    
    function totalSupply() public view returns (uint256) {
        return _totalSupply;
    }
    
    function balanceOf(address account) public view returns (uint256) {
        return _balances[account];
    }
    
    function transfer(address to, uint256 amount) public returns (bool) {
        require(_balances[msg.sender] >= amount, "Not enough tokens");
        _balances[msg.sender] -= amount;
        _balances[to] += amount;
        return true;
    }
    
    function allowance(address tokenOwner, address spender) public view returns (uint256) {
        return _allowances[tokenOwner][spender];
    }
    
    function approve(address spender, uint256 amount) public returns (bool) {
        _allowances[msg.sender][spender] = amount;
        return true;
    }
    
    function transferFrom(address from, address to, uint256 amount) public returns (bool) {
        require(_balances[from] >= amount, "Not enough tokens");
        require(_allowances[from][msg.sender] >= amount, "Not enough allowance");
        
        _balances[from] -= amount;
        _balances[to] += amount;
        _allowances[from][msg.sender] -= amount;
        return true;
    }
    
    function mint(address to, uint256 amount) public {
        require(msg.sender == owner, "Only owner can mint");
        _totalSupply += amount;
        _balances[to] += amount;
    }
    
    function faucet() public {
        require(_balances[msg.sender] == 0, "Already have tokens");
        uint256 amount = 100 * 10**decimals;
        _totalSupply += amount;
        _balances[msg.sender] += amount;
    }
}

contract LudoGame {
    LudoToken public token;
    
    enum Color { RED, GREEN, BLUE, YELLOW }
    enum GameState { WAITING, STARTED, FINISHED }
    
    struct Player {
        address playerAddress;
        string name;
        Color color;
        uint256 score;
        uint256[4] tokenPositions;
        bool isRegistered;
        bool hasStaked;
    }
    
    struct Game {
        uint256 gameId;
        Player[4] players;
        uint256 playerCount;
        address currentPlayer;
        uint256 currentPlayerIndex;
        GameState state;
        uint256 stakeAmount;
        uint256 totalPot;
        address winner;
        uint256 startTime;
    }
    
    mapping(uint256 => Game) public games;
    mapping(address => uint256) public playerToGame;
    uint256 public gameCounter;
    uint256 public stakeAmount = 10 * 10**18;
    
    event PlayerRegistered(uint256 gameId, address player, string name, Color color);
    event GameStarted(uint256 gameId);
    event DiceRolled(uint256 gameId, address player, uint256 result);
    event TokenMoved(uint256 gameId, address player, uint256 tokenIndex, uint256 newPosition);
    event GameWon(uint256 gameId, address winner, uint256 prize);
    
    constructor(address _token) {
        token = LudoToken(_token);
        gameCounter = 0;
    }
    
    function createGame() public {
        gameCounter++;
        Game storage newGame = games[gameCounter];
        newGame.gameId = gameCounter;
        newGame.playerCount = 0;
        newGame.state = GameState.WAITING;
        newGame.stakeAmount = stakeAmount;
    }
    
    function registerPlayer(uint256 gameId, string memory _name, Color _color) public {
        require(games[gameId].gameId != 0, "Game does not exist");
        require(games[gameId].state == GameState.WAITING, "Game already started");
        require(games[gameId].playerCount < 4, "Game is full");
        require(playerToGame[msg.sender] == 0, "Already in a game");
        
        for(uint i = 0; i < games[gameId].playerCount; i++) {
            require(games[gameId].players[i].color != _color, "Color already taken");
        }
        
        uint256 playerIndex = games[gameId].playerCount;
        games[gameId].players[playerIndex].playerAddress = msg.sender;
        games[gameId].players[playerIndex].name = _name;
        games[gameId].players[playerIndex].color = _color;
        games[gameId].players[playerIndex].score = 0;
        games[gameId].players[playerIndex].isRegistered = true;
        games[gameId].players[playerIndex].hasStaked = false;
        
        for(uint j = 0; j < 4; j++) {
            games[gameId].players[playerIndex].tokenPositions[j] = 0;
        }
        
        games[gameId].playerCount++;
        playerToGame[msg.sender] = gameId;
        
        emit PlayerRegistered(gameId, msg.sender, _name, _color);
    }
    
    function stakeTokens(uint256 gameId) public {
        require(games[gameId].gameId != 0, "Game does not exist");
        require(playerToGame[msg.sender] == gameId, "Not in this game");
        require(games[gameId].state == GameState.WAITING, "Game already started");
        
        uint256 playerIndex = getPlayerIndex(gameId, msg.sender);
        require(!games[gameId].players[playerIndex].hasStaked, "Already staked");
        
        require(token.transferFrom(msg.sender, address(this), stakeAmount), "Transfer failed");
        
        games[gameId].players[playerIndex].hasStaked = true;
        games[gameId].totalPot += stakeAmount;
    }
    
    function startGame(uint256 gameId) public {
        require(games[gameId].gameId != 0, "Game does not exist");
        require(games[gameId].playerCount >= 2, "Need at least 2 players");
        require(games[gameId].state == GameState.WAITING, "Game already started");
        
        for(uint i = 0; i < games[gameId].playerCount; i++) {
            require(games[gameId].players[i].hasStaked, "All players must stake");
        }
        
        games[gameId].state = GameState.STARTED;
        games[gameId].currentPlayerIndex = 0;
        games[gameId].currentPlayer = games[gameId].players[0].playerAddress;
        games[gameId].startTime = block.timestamp;
        
        emit GameStarted(gameId);
    }
    
    function rollDice(uint256 gameId) public returns (uint256) {
        require(games[gameId].gameId != 0, "Game does not exist");
        require(games[gameId].state == GameState.STARTED, "Game not started");
        require(msg.sender == games[gameId].currentPlayer, "Not your turn");
        
        uint256 result = (uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.difficulty,
            msg.sender,
            block.number
        ))) % 6) + 1;
        
        emit DiceRolled(gameId, msg.sender, result);
        return result;
    }
    
    function moveToken(uint256 gameId, uint256 tokenIndex, uint256 steps) public {
        require(games[gameId].gameId != 0, "Game does not exist");
        require(games[gameId].state == GameState.STARTED, "Game not started");
        require(msg.sender == games[gameId].currentPlayer, "Not your turn");
        require(tokenIndex < 4, "Invalid token index");
        
        uint256 playerIndex = getPlayerIndex(gameId, msg.sender);
        uint256 currentPosition = games[gameId].players[playerIndex].tokenPositions[tokenIndex];
        
        if(currentPosition == 0 && steps != 6) {
            nextTurn(gameId);
            return;
        }
        
        uint256 newPosition = currentPosition + steps;
        if(newPosition > 57) {
            nextTurn(gameId);
            return;
        }
        
        games[gameId].players[playerIndex].tokenPositions[tokenIndex] = newPosition;
        
        if(newPosition == 57) {
            games[gameId].players[playerIndex].score += 1;
        }
        
        emit TokenMoved(gameId, msg.sender, tokenIndex, newPosition);
        
        if(games[gameId].players[playerIndex].score == 4) {
            games[gameId].state = GameState.FINISHED;
            games[gameId].winner = msg.sender;
            
            require(token.transfer(msg.sender, games[gameId].totalPot), "Prize transfer failed");
            
            emit GameWon(gameId, msg.sender, games[gameId].totalPot);
            
            for(uint i = 0; i < games[gameId].playerCount; i++) {
                playerToGame[games[gameId].players[i].playerAddress] = 0;
            }
        } else {
            if(steps != 6) {
                nextTurn(gameId);
            }
        }
    }
    
    function nextTurn(uint256 gameId) internal {
        games[gameId].currentPlayerIndex = (games[gameId].currentPlayerIndex + 1) % games[gameId].playerCount;
        games[gameId].currentPlayer = games[gameId].players[games[gameId].currentPlayerIndex].playerAddress;
    }
    
    function getPlayerIndex(uint256 gameId, address player) internal view returns (uint256) {
        for(uint i = 0; i < games[gameId].playerCount; i++) {
            if(games[gameId].players[i].playerAddress == player) {
                return i;
            }
        }
        revert("Player not found");
    }
    
    function getGame(uint256 gameId) public view returns (Game memory) {
        return games[gameId];
    }
    
    function getPlayerTokenPositions(uint256 gameId, address player) public view returns (uint256[4] memory) {
        uint256 playerIndex = getPlayerIndex(gameId, player);
        return games[gameId].players[playerIndex].tokenPositions;
    }
    
    function getCurrentPlayer(uint256 gameId) public view returns (address) {
        return games[gameId].currentPlayer;
    }
    
    function getGameState(uint256 gameId) public view returns (GameState) {
        return games[gameId].state;
    }
}