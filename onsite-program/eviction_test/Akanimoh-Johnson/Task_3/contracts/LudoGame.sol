// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ILudoToken {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

    error NotRegistered();
    error ColorTaken();
    error MaxPlayersReached();
    error InsufficientStake();
    error GameAlreadyStarted();
    error NoPlayers();

contract LudoGame {
  
    enum Color { RED, GREEN, BLUE, YELLOW }

    struct Player {
        string name;
        Color color;
        uint256 score;
        uint256 tokensStaked;
        bool registered;
    }

    ILudoToken public token;
    mapping(address => Player) public players;
    mapping(Color => bool) public colorTaken;
    address[] public playerList;
    uint256 public constant MAX_PLAYERS = 4;
    uint256 public gameStake = 1 ether;
    address public winner;

    event PlayerRegistered(address player, string name, Color color);
    event GameStarted();
    event MoveMade(address player, uint256 diceRoll, uint256 newScore);
    event GameEnded(address winner);


    constructor(address _token) {
        token = ILudoToken(_token);
    }

    function register(string memory _name, Color _color) external {
        if (players[msg.sender].registered) revert NotRegistered();
        if (colorTaken[_color]) revert ColorTaken();
        if (playerList.length >= MAX_PLAYERS) revert MaxPlayersReached();

        players[msg.sender] = Player(_name, _color, 0, 0, true);
        colorTaken[_color] = true;
        playerList.push(msg.sender);

        emit PlayerRegistered(msg.sender, _name, _color);
    }

    function startGame() external {
        if (playerList.length == 0) revert NoPlayers();
        for (uint i = 0; i < playerList.length; i++) {
            if (!players[playerList[i]].registered || players[playerList[i]].tokensStaked == 0) {
                revert InsufficientStake();
            }
            require(token.transferFrom(playerList[i], address(this), gameStake), "Transfer failed");
            players[playerList[i]].tokensStaked = gameStake;
        }
        emit GameStarted();
    }

    function rollDice() internal view returns (uint256) {
        return uint256(keccak256(abi.encodePacked(block.timestamp, block.difficulty, msg.sender))) % 6 + 1;
    }

    function makeMove() external {
        if (!players[msg.sender].registered) revert NotRegistered();
        uint256 diceRoll = rollDice();
        players[msg.sender].score += diceRoll;
        emit MoveMade(msg.sender, diceRoll, players[msg.sender].score);

        if (players[msg.sender].score >= 100) {
            winner = msg.sender;
            emit GameEnded(winner);
            payable(winner).transfer(address(this).balance);
        }
    }

    function getPlayer(address _player) external view returns (Player memory) {
        return players[_player];
    }
}