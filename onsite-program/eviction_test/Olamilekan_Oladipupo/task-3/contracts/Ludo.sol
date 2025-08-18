// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import "../TicketToken.sol";

contract Ludo {
    enum Color { RED, GREEN, BLUE, YELLOW }
    uint8 public constant MAX_PLAYERS = 4;
    uint256 public constant WINNING_SCORE = 50;
    uint256 public immutable STAKE_AMOUNT;

    TicketToken ticketToken;



    struct Player {
        address addr;
        string name;
        Color color;
        uint256 score;
        bool registered;
    }

    mapping(Color => bool) public colorTaken;
    mapping(address => Player) public players;
    address[] public playerOrder; 

    uint8 public totalPlayers;
    bool public gameStarted;
    bool public gameOver;
    address public winner;
    uint256 public pot;

    uint8 public currentPlayerIdx; 

    modifier onlyRegistered() {
        require(players[msg.sender].registered, "Not registered");
        _;
    }

    modifier onlyGameActive() {
        require(gameStarted && !gameOver, "Game not active");
        _;
    }

    event PlayerRegistered(address indexed player, string name, Color color);
    event GameStarted();
    event DiceRolled(address indexed player, uint8 roll, uint256 score);
    event WinnerDeclared(address indexed winner, uint256 winningScore, uint256 prize);

    constructor(address tokenAddress, uint256 stakeAmount) {
        ticketToken = TicketToken(tokenAddress);
        STAKE_AMOUNT = stakeAmount;
    }

    function register(string calldata name, Color color) external {
        require(!gameStarted, "Game already started");
        require(!players[msg.sender].registered, "Already registered");
        require(!colorTaken[color], "Color taken");
        require(totalPlayers < MAX_PLAYERS, "Max players reached");

        // Collect stake
        require(ticketToken.transferFrom(msg.sender, address(this), STAKE_AMOUNT), "Token transfer failed");

        Player memory newPlayer = Player({
            addr: msg.sender,
            name: name,
            color: color,
            score: 0,
            registered: true
        });

        players[msg.sender] = newPlayer;
        colorTaken[color] = true;
        playerOrder.push(msg.sender);
        pot += STAKE_AMOUNT;
        totalPlayers++;

        emit PlayerRegistered(msg.sender, name, color);

        if (totalPlayers == MAX_PLAYERS) {
            gameStarted = true;
            currentPlayerIdx = 0;
            emit GameStarted();
        }
    }

    function getPlayer(address addr) external view returns (Player memory) {
        return players[addr];
    }

    function rollDice() external onlyRegistered onlyGameActive {
        require(playerOrder[currentPlayerIdx] == msg.sender, "Not your turn");

        uint8 roll = _randomDice();
        players[msg.sender].score += roll;

        emit DiceRolled(msg.sender, roll, players[msg.sender].score);

        if (players[msg.sender].score >= WINNING_SCORE) {
            gameOver = true;
            winner = msg.sender;
            require(ticketToken.transfer(msg.sender, pot), "Token payout failed");
            emit WinnerDeclared(msg.sender, players[msg.sender].score, pot);
        } else {
            currentPlayerIdx = (currentPlayerIdx + 1) % MAX_PLAYERS;
        }
    }

    function _randomDice() private view returns (uint8) {
        return uint8(
            (uint256(
                keccak256(
                    abi.encodePacked(
                        block.timestamp,
                        blockhash(block.number - 1),
                        msg.sender
                    )
                )
            ) % 6) + 1
        );
    }

    function currentPlayer() external view returns (address) {
        if (!gameStarted || gameOver) return address(0);
        return playerOrder[currentPlayerIdx];
    }

    function resetGame() external {
        require(gameOver, "Game not over");
        for (uint8 i = 0; i < playerOrder.length; i++) {
            colorTaken[players[playerOrder[i]].color] = false;
            delete players[playerOrder[i]];
        }
        delete playerOrder;
        totalPlayers = 0;
        gameStarted = false;
        gameOver = false;
        winner = address(0);
        pot = 0;
        currentPlayerIdx = 0;
    }

    function getAllPlayers() external view returns (Player[] memory) {
        Player[] memory result = new Player[](playerOrder.length);
        for (uint8 i = 0; i < playerOrder.length; i++) {
            result[i] = players[playerOrder[i]];
        }
        return result;
    }
}