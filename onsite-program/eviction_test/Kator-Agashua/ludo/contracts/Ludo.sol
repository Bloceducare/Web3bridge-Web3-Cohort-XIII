// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Ludo {
    uint256 private playerId;
    uint256 private nonce;
    uint256 public random;
    uint256 private constant MAX_ROLL = 5;
    bool public gameFinished;

    IERC20 public immutable stakingToken;
    uint256 public immutable stakeAmount;
    uint256 public totalStaked;

    enum Colors { RED, BLUE, GREEN, YELLOW }

    struct Player {
        string name;
        uint256 playerId;
        uint256 score;
        Colors color;
        bool isWinner;
        bool registered;
    }

    address[] public players;
    mapping(address => Player) public player;
    mapping(Colors => bool) public colorTaken;
    mapping(address => uint256) public rollsDone;

    event DiceRolled(address indexed player, uint256 roll);
    event WinnerDeclared(address indexed winner, string name, uint256 score);

    modifier onlyBeforeFinish() {
        require(!gameFinished, "Game already finished");
        _;
    }

    modifier onlyRegistered() {
        require(player[msg.sender].registered, "Not registered");
        _;
    }

    modifier onlyNewPlayer() {
        require(!player[msg.sender].registered, "Already registered");
        _;
    }

    modifier validColor(uint8 colorIndex) {
        require(colorIndex < 4, "Invalid color");
        _;
    }

    constructor(address _tokenAddr, uint256 _stakeAmount) {
        require(_tokenAddr != address(0), "Zero token address");
        require(_stakeAmount > 0, "Stake must be > 0");
        stakingToken = IERC20(_tokenAddr);
        stakeAmount = _stakeAmount;
    }

    function registerUser(string calldata _name, uint8 colorIndex)
        external
        onlyBeforeFinish
        onlyNewPlayer
        validColor(colorIndex)
    {
        require(bytes(_name).length > 0, "Name required");
        require(players.length < 4, "Max 4 players");

        // pull stake from player
        bool sent = stakingToken.transferFrom(msg.sender, address(this), stakeAmount);
        require(sent, "Stake transfer failed");

        // record player
        playerId++;
        Colors c = Colors(colorIndex);
        player[msg.sender] = Player({
            name: _name,
            playerId: playerId,
            score: 0,
            color: c,
            isWinner: false,
            registered: true
        });

        colorTaken[c] = true;
        players.push(msg.sender);
        totalStaked += stakeAmount;
    }

    function rollDice() external onlyBeforeFinish onlyRegistered returns (uint256) {
        require(rollsDone[msg.sender] < MAX_ROLL, "No rolls left");

        // generate pseudo-random roll
        nonce++;
        uint256 diceRoll = (uint256(
            keccak256(abi.encodePacked(block.timestamp, msg.sender, nonce))
        ) % 6) + 1;

        player[msg.sender].score += diceRoll;
        rollsDone[msg.sender]++;
        random = diceRoll;

        emit DiceRolled(msg.sender, diceRoll);
        return diceRoll;
    }

    function determineWinner() external onlyBeforeFinish {
        require(players.length > 0, "No players");
        // ensure everyone has rolled MAX_ROLL
        for (uint i = 0; i < players.length; i++) {
            require(rollsDone[players[i]] == MAX_ROLL, "Awaiting rolls");
        }

        // find highest scorer
        address winningAddr = players[0];
        uint256 highScore = player[winningAddr].score;
        for (uint i = 1; i < players.length; i++) {
            address p = players[i];
            if (player[p].score > highScore) {
                highScore = player[p].score;
                winningAddr = p;
            }
        }

        // mark winner, finish game
        player[winningAddr].isWinner = true;
        gameFinished = true;

        // payout entire pot
        bool paid = stakingToken.transfer(winningAddr, totalStaked);
        require(paid, "Payout failed");

        emit WinnerDeclared(winningAddr, player[winningAddr].name, highScore);
    }
}