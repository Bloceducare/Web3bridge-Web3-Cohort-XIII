// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IERC20 {
    function transfer(address to, uint256 amt) external returns (bool);
    function transferFrom(address from, address to, uint256 amt) external returns (bool);
    function balanceOf(address a) external view returns (uint256);
    function approve(address spender, uint256 amt) external returns (bool);
}

contract Ludo20Token {
    string public name = "web3BridgeEviction";
    string public symbol = "wBE";
    uint8  public decimals = 18;
    uint256 public totalSupply;
    address public owner;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    error NotOwner();

    constructor() { owner = msg.sender; }

    function mint(address to, uint256 amt) external {
        if (msg.sender != owner) revert NotOwner();
        balanceOf[to] += amt;
        totalSupply += amt;
    }

    function approve(address spender, uint256 amt) external returns (bool) {
        allowance[msg.sender][spender] = amt;
        return true;
    }

    function transfer(address to, uint256 amt) external returns (bool) {
        if (balanceOf[msg.sender] < amt) return false;
        balanceOf[msg.sender] -= amt;
        balanceOf[to] += amt;
        return true;
    }

    function transferFrom(address from, address to, uint256 amt) external returns (bool) {
        if (balanceOf[from] < amt) return false;
        if (allowance[from][msg.sender] < amt) return false;
        allowance[from][msg.sender] -= amt;
        balanceOf[from] -= amt;
        balanceOf[to] += amt;
        return true;
    }
}

contract web3BridgeLudo {

//SETTING SOME CUSTOM ERRORS
    error AlreadyRegistered();
    error ColorTaken();
    error MaxPlayersReached();
    error InvalidColor();
    error NotRegistered();
    error AlreadyStaked();
    error NeedExactStake();
    error StakeTransferFailed();
    error NotEnoughPlayers();
    error GameAlreadyStarted();
    error GameNotActive();
    error NotYourTurn();
    error NoWinnerYet();

// SETTING UP SOME TWEAKS
    uint8 public constant MAX_PLAYERS = 4;
    uint8 public constant COLORS = 4;    
    uint256 public constant STAKE = 100 ether;     
    uint256 public constant TARGET_SCORE = 20;    


    IERC20 public immutable token;

    struct Player {
        string name;
        uint8 color;   
        uint256 score;     
        bool staked;
        bool exists;
    }

    address[] public playerList;
    mapping(address => Player) public players;
    mapping(uint8 => bool) public colorTaken;


    bool public gameActive;
    uint8 public turnIndex;   
    uint256 public pot;
    uint256 private nonce;  

    event PlayerRegistered(address indexed player, string name, uint8 color);
    event Staked(address indexed player, uint256 amount);
    event GameStarted(uint8 players);
    event DiceRolled(address indexed player, uint8 value);
    event PlayerMoved(address indexed player, uint256 newScore);
    event Winner(address indexed player, uint256 prize);

    constructor(IERC20 _token) {
        token = _token;
    }


    function register(string calldata name, uint8 color) external {
        if (gameActive) revert GameAlreadyStarted();
        if (players[msg.sender].exists) revert AlreadyRegistered();
        if (playerList.length >= MAX_PLAYERS) revert MaxPlayersReached();
        if (color >= COLORS) revert InvalidColor();
        if (colorTaken[color]) revert ColorTaken();

        players[msg.sender] = Player({ name: name, color: color, score: 0, staked: false, exists: true });
        colorTaken[color] = true;
        playerList.push(msg.sender);
        emit PlayerRegistered(msg.sender, name, color);
    }

    function stake() external {
        Player storage p = players[msg.sender];
        if (!p.exists) revert NotRegistered();
        if (p.staked) revert AlreadyStaked();

        bool ok = token.transferFrom(msg.sender, address(this), STAKE);
        if (!ok) revert StakeTransferFailed();

        p.staked = true;
        pot += STAKE;
        emit Staked(msg.sender, STAKE);
    }


    function startGame() external {
        if (gameActive) revert GameAlreadyStarted();
        if (playerList.length < 2) revert NotEnoughPlayers();


        for (uint256 i = 0; i < playerList.length; i++) {
            if (!players[playerList[i]].staked) revert NeedExactStake();
        }

        gameActive = true;
        turnIndex = 0;
        emit GameStarted(uint8(playerList.length));
    }


    function rollDiceAndMove() external {
        if (!gameActive) revert GameNotActive();
        if (playerList[turnIndex] != msg.sender) revert NotYourTurn();


        nonce++;
        uint8 value = uint8(uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao, msg.sender, nonce))) % 6) + 1;

        players[msg.sender].score += value;
        emit DiceRolled(msg.sender, value);
        emit PlayerMoved(msg.sender, players[msg.sender].score);

        if (players[msg.sender].score >= TARGET_SCORE) {
   
            uint256 prize = pot;
            pot = 0;
            gameActive = false;
            bool ok = token.transfer(msg.sender, prize);
            if (!ok) revert StakeTransferFailed();
            emit Winner(msg.sender, prize);
            return;
        }

   
        turnIndex = uint8((uint256(turnIndex) + 1) % playerList.length);
    }


    function currentPlayer() external view returns (address) {
        if (!gameActive) return address(0);
        return playerList[turnIndex];
    }

    function getPlayers() external view returns (address[] memory) {
        return playerList;
    }
}
