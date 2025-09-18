// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
}


contract Ludo {
    enum Color { RED, GREEN, BLUE, YELLOW }

    error GameAlreadyStarted();
    error MaxPlayersReached();
    error AlreadyRegistered();
    error ColorTaken();
    error StakeFailed();
    error GameNotStarted();
    error NotYourTurn();
    error GameEnded();
    error PayoutFailed();

    struct Player {
        string name;
        uint256 score;
        Color color;
        address addr;
        bool registered;
    }

    IERC20 public token;
    uint256 public stakeAmount;
    Player[4] public players;
    uint8 public playerCount;
    uint8 public turn;
    bool public gameStarted;
    address public winner;
    uint256 public pot;

    mapping(address => uint8) public playerIndex;

    event Registered(address indexed player, string name, Color color);
    event DiceRolled(address indexed player, uint8 dice);
    event Move(address indexed player, uint256 newScore);
    event Winner(address indexed winner, uint256 amount);

    constructor(address _token, uint256 _stakeAmount) {
        token = IERC20(_token);
        stakeAmount = _stakeAmount;
    }

    function register(string calldata name, Color color) external {
        if (gameStarted) revert GameAlreadyStarted();
        if (playerCount >= 4) revert MaxPlayersReached();
        for (uint8 i = 0; i < playerCount; i++) {
            if (players[i].addr == msg.sender) revert AlreadyRegistered();
            if (players[i].color == color) revert ColorTaken();
        }
        if (!token.transferFrom(msg.sender, address(this), stakeAmount)) revert StakeFailed();
        players[playerCount] = Player(name, 0, color, msg.sender, true);
        playerIndex[msg.sender] = playerCount;
        playerCount++;
        pot += stakeAmount;
        emit Registered(msg.sender, name, color);
        if (playerCount == 4) {
            gameStarted = true;
        }
    }

    function rollDice() public view returns (uint8) {
        if (!gameStarted) revert GameNotStarted();
        return uint8(uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao, msg.sender))) % 6 + 1);
    }

    function play() external {
        if (!gameStarted) revert GameNotStarted();
        if (players[turn].addr != msg.sender) revert NotYourTurn();
        if (winner != address(0)) revert GameEnded();
        uint8 dice = rollDice();
        emit DiceRolled(msg.sender, dice);
        players[turn].score += dice;
        emit Move(msg.sender, players[turn].score);
        if (players[turn].score >= 30) {
            winner = msg.sender;
            if (!token.transfer(msg.sender, pot)) revert PayoutFailed();
            emit Winner(msg.sender, pot);
        }
        turn = (turn + 1) % 4;
    }

    function getPlayers() external view returns (Player[4] memory) {
        return players;
    }
}
