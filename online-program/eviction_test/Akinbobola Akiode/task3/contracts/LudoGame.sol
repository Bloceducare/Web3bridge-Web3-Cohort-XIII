// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "./ErrorCodes.sol";

interface IERC20 {
    function transferFrom(address from, address to, uint256 value) external returns (bool);
    function transfer(address to, uint256 value) external returns (bool);
}

contract LudoGame {
    enum Color { RED, GREEN, BLUE, YELLOW }

    struct Player {
        string name;
        uint256 score;
        Color color;
        uint256 position;
        bool registered;
        bool staked;
    }

    IERC20 public token;
    uint256 public stakeAmount;
    address[] public players;
    mapping(address => Player) public playerInfo;
    mapping(uint8 => bool) public colorUsed;
    bool public gameStarted;
    uint256 public constant WIN_SCORE = 30;
    address public winner;
    uint256 private nonce;

    event PlayerRegistered(address indexed player, string name, Color color);
    event Staked(address indexed player, uint256 amount);
    event GameStarted();
    event DiceRolled(address indexed player, uint256 roll);
    event PlayerMoved(address indexed player, uint256 newPosition, uint256 newScore);
    event WinnerDeclared(address indexed winner, uint256 prize);
    event GameReset();

    constructor(address _token, uint256 _stakeAmount) {
        token = IERC20(_token);
        stakeAmount = _stakeAmount;
    }

    function register(string memory _name, Color _color) external {
        if (playerInfo[msg.sender].registered) revert AlreadyRegistered();
        if (players.length >= 4) revert MaxPlayersReached();
        if (colorUsed[uint8(_color)]) revert ColorAlreadyTaken();

        playerInfo[msg.sender] = Player(_name, 0, _color, 0, true, false);
        players.push(msg.sender);
        colorUsed[uint8(_color)] = true;
        emit PlayerRegistered(msg.sender, _name, _color);
    }

    function stake() external {
        Player storage p = playerInfo[msg.sender];
        if (!p.registered) revert NotRegistered();
        if (gameStarted) revert GameAlreadyStarted();
        if (p.staked) revert AlreadyStaked();

        token.transferFrom(msg.sender, address(this), stakeAmount);
        p.staked = true;
        emit Staked(msg.sender, stakeAmount);
    }

    function startGame() external {
        if (gameStarted) revert GameAlreadyStarted();
        if (players.length < 2) revert NeedMorePlayers();
        for (uint256 i = 0; i < players.length; i++) {
            if (!playerInfo[players[i]].staked) revert AllPlayersMustStake();
        }
        gameStarted = true;
        winner = address(0);
        emit GameStarted();
    }

    function rollDice() external {
        if (!gameStarted) revert GameNotStarted();
        Player storage p = playerInfo[msg.sender];
        if (!p.registered) revert NotRegistered();

        uint256 roll = _rand(msg.sender) % 6 + 1;
        p.position += roll;
        p.score += roll;

        emit DiceRolled(msg.sender, roll);
        emit PlayerMoved(msg.sender, p.position, p.score);

        if (p.position >= WIN_SCORE) {
            uint256 prize = stakeAmount * players.length;
            gameStarted = false;
            winner = msg.sender;
            token.transfer(msg.sender, prize);
            emit WinnerDeclared(msg.sender, prize);
            _resetGame();
        }
    }

    function _rand(address user) private returns (uint256) {
        nonce++;
        return uint256(keccak256(abi.encodePacked(block.prevrandao, block.timestamp, user, nonce)));
    }

    function _resetGame() private {
        for (uint256 i = 0; i < players.length; i++) {
            Player storage p = playerInfo[players[i]];
            p.position = 0;
            p.score = 0;
            p.staked = false;
        }
        emit GameReset();
    }

    function playersCount() external view returns (uint256) {
        return players.length;
    }
}