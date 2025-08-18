// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/tokens/ERC20/IERC20.sol";

contract LudoGame{
    string public name = "LudoToken";
    string public symbol = "LUDO";
    uint8 public decimals = 18;
    uint256 public override totalSupply;
    mapping(address => uint256) public override balanceOf;
    mapping(address => mapping(address => uint256)) public override allowance;

    enum Color { RED, GREEN, BLUE, YELLOW }

    struct Player {
        address addr;
        string name;
        Color color;
        uint256 score;
    }

    mapping(address => Player) public players;
    address[] public playerList;
    bool public gameStarted;
    bool public gameEnded;
    uint256 public currentTurn;
    address public winner;
    uint256 constant MAX_PLAYERS = 4;
    uint256 constant WINNING_SCORE = 50;
    uint256 constant STAKE_AMOUNT = 1 * 10**18;

    event DiceRolled(address player, uint256 roll);
    event TokenMoved(address player, uint256 newPosition);
    event PlayerKilled(address killer, address victim);
    event GameWon(address winner);

    function register(string memory _name, Color _color) public {
        require(!gameStarted, "Game has already started");
        require(playerList.length < MAX_PLAYERS, "Maximum players reached");
        require(players[msg.sender].addr == address(0), "Already registered");

        for (uint256 i = 0; i < playerList.length; i++) {
            require(players[playerList[i]].color != _color, "Color already taken");
        }

        transferFrom(msg.sender, address(this), STAKE_AMOUNT);

        players[msg.sender] = Player(msg.sender, _name, _color, 0);
        playerList.push(msg.sender);

        if (playerList.length == MAX_PLAYERS) {
            gameStarted = true;
        }
    }

    function _rollDice() internal view returns (uint256) {
        uint256 randomNumber = (block.timestamp + block.prevrandao + uint256(uint160(msg.sender))) % 6 + 1;
        return randomNumber;
    }

    function playTurn() public {
        require(gameStarted, "Game not started");
        require(!gameEnded, "Game has ended");
        require(playerList[currentTurn] == msg.sender, "Not your turn");

        uint256 roll = _rollDice();
        emit DiceRolled(msg.sender, roll);

        uint256 currentPos = players[msg.sender].score;

        if (currentPos == 0 && roll != 6) {
        } else {
            uint256 newPos = currentPos == 0 ? roll : currentPos + roll;

            if (newPos >= WINNING_SCORE) {
                players[msg.sender].score = newPos;
                winner = msg.sender;
                gameEnded = true;
                _transfer(address(this), winner, balanceOf[address(this)]);
                emit GameWon(winner);
                return;
            }

            for (uint256 i = 0; i < playerList.length; i++) {
                address other = playerList[i];
                if (other != msg.sender && players[other].score == newPos) {
                    players[other].score = 0;
                    emit PlayerKilled(msg.sender, other);
                }
            }

            players[msg.sender].score = newPos;
            emit TokenMoved(msg.sender, newPos);
        }

        currentTurn = (currentTurn + 1) % playerList.length;
    }
}