// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract LudoGame {
    enum Color {
        RED,
        GREEN,
        BLUE,
        YELLOW
    }

    enum GameState {
        Registering,
        Started,
        Finished
    }

    struct Player {
        address addr;
        string name;
        uint256 score;
        Color color;
        bool exists;
    }

    IERC20 public immutable token;
    GameState public gameState;
    uint256 public winningScore;
    uint256 public stakeAmount;
    uint256 public pot;
    uint256 public currentTurnIndex;
    address public winner;

    mapping(address => Player) public addressToPlayer;
    mapping(Color => bool) public colorTaken;
    address[] public players;

    uint256 private nonce;

    event PlayerRegistered(address indexed player, string name, Color color);
    event GameStarted(uint256 stakeAmount, uint256 playerCount);
    event DiceRolled(address indexed player, uint256 roll, uint256 newScore, uint256 nextTurnIndex);
    event GameFinished(address indexed winner, uint256 pot);

    error NotRegistering();
    error AlreadyRegistered();
    error ColorAlreadyTaken();
    error MaxPlayersReached();
    error NotPlayerTurn();
    error GameNotStarted();
    error GameFinishedAlready();
    error NeedAtLeastTwoPlayers();

    constructor(IERC20 _token, uint256 _winningScore) {
        token = _token;
        winningScore = _winningScore;
        gameState = GameState.Registering;
    }

    function getPlayers() external view returns (Player[] memory) {
        Player[] memory result = new Player[](players.length);
        for (uint256 i = 0; i < players.length; i++) {
            result[i] = addressToPlayer[players[i]];
        }
        return result;
    }

    function registerPlayer(string calldata name, Color color) external {
        if (gameState != GameState.Registering) revert NotRegistering();
        if (players.length >= 4) revert MaxPlayersReached();
        if (addressToPlayer[msg.sender].exists) revert AlreadyRegistered();
        if (colorTaken[color]) revert ColorAlreadyTaken();

        addressToPlayer[msg.sender] = Player({
            addr: msg.sender,
            name: name,
            score: 0,
            color: color,
            exists: true
        });
        players.push(msg.sender);
        colorTaken[color] = true;

        emit PlayerRegistered(msg.sender, name, color);
    }

    function startGame(uint256 _stakeAmount) external {
        if (gameState != GameState.Registering) revert NotRegistering();
        if (players.length < 2) revert NeedAtLeastTwoPlayers();

        stakeAmount = _stakeAmount;

        for (uint256 i = 0; i < players.length; i++) {
            address playerAddr = players[i];
            require(token.transferFrom(playerAddr, address(this), stakeAmount), "stake transfer failed");
            pot += stakeAmount;
        }

        currentTurnIndex = 0;
        gameState = GameState.Started;
        emit GameStarted(stakeAmount, players.length);
    }

    function playTurn() external returns (uint256) {
        if (gameState != GameState.Started) revert GameNotStarted();
        if (msg.sender != players[currentTurnIndex]) revert NotPlayerTurn();

        uint256 roll = _rollDice();
        Player storage player = addressToPlayer[msg.sender];
        player.score += roll;

        if (player.score >= winningScore) {
            winner = msg.sender;
            gameState = GameState.Finished;
            require(token.transfer(winner, pot), "payout failed");
            emit DiceRolled(msg.sender, roll, player.score, currentTurnIndex);
            emit GameFinished(winner, pot);
        } else {
            currentTurnIndex = (currentTurnIndex + 1) % players.length;
            emit DiceRolled(msg.sender, roll, player.score, currentTurnIndex);
        }

        return roll;
    }

    function _rollDice() internal returns (uint256) {
        nonce++;
        uint256 random = uint256(
            keccak256(
                abi.encode(
                    block.prevrandao,
                    block.timestamp,
                    msg.sender,
                    nonce,
                    players.length,
                    currentTurnIndex
                )
            )
        );
        return (random % 6) + 1;
    }
} 