// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./LudoToken.sol";
contract Ludo {
    struct Participant {
        uint256 id;
        address account;
        string name;
        Colors color;
        uint256 score;
    }

    enum Colors {
        RED,
        GREEN,
        BLUE,
        YELLOW
    }

    address public owner;

    uint256 public currentGame;
    uint256 public playerCount;

    uint256 constant ENTRY_FEE = 100 * 1e18;
    uint256 constant MAX_PLAYERS = 4;
    uint256 constant WINNING_SCORE = 20;

    uint256 public lastDiceRoll;
    uint256 public currentPlayerTurn;

    mapping(uint256 => bool) public hasRolledThisTurn;
    mapping(uint256 => Participant) public participants;
    mapping(address => bool) public hasJoined;
    mapping(Colors => bool) public colorTaken;

    LudoToken public token;

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier validEntry(Colors _color) {
        require(playerCount < MAX_PLAYERS, "Maximum 4 players allowed");
        require(!hasJoined[msg.sender], "Cannot join twice in the same game");
        require(!colorTaken[_color], "Color already taken by another player");
        _;
    }

    constructor(address _token) {
        owner = msg.sender;
        currentGame = 1;
        playerCount = 0;
        currentPlayerTurn = 0;
        token = LudoToken(_token);
    }

    function register(string memory _name, Colors _color) external validEntry(_color) {
        require(token.transferFrom(msg.sender, address(this), ENTRY_FEE), "Stake failed");

        participants[playerCount] = Participant({
            id: playerCount,
            account: msg.sender,
            name: _name,
            color: _color,
            score: 0
        });

        hasJoined[msg.sender] = true;
        colorTaken[_color] = true;
        playerCount++;
    }

    function rollDice() external returns (uint256) {
        require(hasJoined[msg.sender], "Must be registered to play");
        require(playerCount == MAX_PLAYERS, "Need 4 players to start game");
        require(participants[currentPlayerTurn].account == msg.sender, "Not your turn");
        require(!hasRolledThisTurn[currentPlayerTurn], "Already rolled dice this turn");

        uint256 diceValue = (uint256(keccak256(abi.encodePacked(
            block.prevrandao,
            msg.sender,
            currentPlayerTurn,
            block.number
        ))) % 6) + 1;

        lastDiceRoll = diceValue;
        hasRolledThisTurn[currentPlayerTurn] = true;

        participants[currentPlayerTurn].score += diceValue;

        if (participants[currentPlayerTurn].score >= WINNING_SCORE) {
            _declareWinner(participants[currentPlayerTurn].account);
            return diceValue;
        }

        currentPlayerTurn = (currentPlayerTurn + 1) % MAX_PLAYERS;
        hasRolledThisTurn[currentPlayerTurn] = false;

        return diceValue;
    }

    function _declareWinner(address winner) internal {
        uint256 prizeAmount = token.balanceOf(address(this));
        require(prizeAmount > 0, "No prize to claim");

        require(token.transfer(winner, prizeAmount), "Prize transfer failed");

        _resetGame();
    }

    function _resetGame() internal {
        for (uint256 i = 0; i < playerCount; i++) {
            hasJoined[participants[i].account] = false;
            colorTaken[participants[i].color] = false;
            hasRolledThisTurn[i] = false;
            delete participants[i];
        }

        playerCount = 0;
        currentGame++;
        currentPlayerTurn = 0;
        lastDiceRoll = 0;
    }
}
