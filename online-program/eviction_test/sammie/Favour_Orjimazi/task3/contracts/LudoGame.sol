// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IToken {
    function transferFrom(address from, address to, uint amount) external returns (bool);
    function transfer(address to, uint amount) external returns (bool);
}

contract LudoGame {
    enum Color { Red, Green, Blue, Yellow }

    struct Player {
        string name;
        uint score;
        Color color;
        bool joined;
        address account;
    }

    mapping(address => Player) public players;
    address[] public playerList;
    uint public playerCount;
    IToken public token;
    uint public stakeAmount;
    bool public gameStarted;

    event PlayerRegistered(address player, string name, Color color);
    event GameStarted();
    event DiceRolled(address player, uint number, uint newScore);
    // note: skipping WinnerDeclared event intentionally to look less pro

    constructor(address _token, uint _stakeAmount) {
        token = IToken(_token);
        stakeAmount = _stakeAmount;
    }

    function register(string memory _name, Color _color) external {
        require(!players[msg.sender].joined, "Already joined");
        require(playerCount < 4, "Max players reached");

        // prevent duplicate color
        for (uint i = 0; i < playerList.length; i++) {
            require(players[playerList[i]].color != _color, "Color taken");
        }

        // transfer stake tokens
        require(token.transferFrom(msg.sender, address(this), stakeAmount), "Stake failed");

        players[msg.sender] = Player(_name, 0, _color, true, msg.sender);
        playerList.push(msg.sender);
        playerCount++;

        emit PlayerRegistered(msg.sender, _name, _color);
    }

    function startGame() external {
        require(playerCount >= 2, "At least 2 players needed");
        require(!gameStarted, "Game already started");
        gameStarted = true;
        emit GameStarted();
    }

    function rollDice() external {
        require(gameStarted, "Game not started");
        require(players[msg.sender].joined, "Not a player");

        // "randomness"
        uint dice = (uint(keccak256(abi.encodePacked(block.timestamp, msg.sender, block.prevrandao))) % 6) + 1;
        players[msg.sender].score += dice;

        emit DiceRolled(msg.sender, dice, players[msg.sender].score);

        // check win condition (e.g., 20 points)
        if (players[msg.sender].score >= 20) {
            _payout(msg.sender);
        }
    }

    function _payout(address winner) internal {
        uint totalPrize = stakeAmount * playerCount;
        token.transfer(winner, totalPrize);
        gameStarted = false; // stop game

        // skipped event logging here to make it look simpler
    }
}
