// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/ILudoGame.sol";
import "./libs/Errors.sol";

contract LudoGame is ILudoGame {
    using Errors for *;
    IERC20 public immutable token;
    uint256 public immutable stakeAmount;
    uint8 public playerCount;
    bool public gameStarted;

    mapping(address => Player) public players;
    mapping(Color => bool) public colorTaken;
    address[] public playerList;

    constructor(IERC20 _token, uint256 _stakeAmount) {
        token = _token;
        stakeAmount = _stakeAmount;
    }

    modifier onlyPlayer() {
        if (!players[msg.sender].registered) revert Errors.NotRegistered();
        _;
    }

    function register(string calldata _name, Color _color) external {
        if (playerCount >= 4) revert Errors.MaxPlayersReached();
        if (players[msg.sender].registered) revert Errors.AlreadyRegistered();
        if (colorTaken[_color]) revert Errors.ColorTaken();

        players[msg.sender] = Player({
            name: _name,
            score: 0,
            color: _color,
            addr: msg.sender,
            registered: true
        });

        playerList.push(msg.sender);
        colorTaken[_color] = true;
        playerCount++;
    }

    function stake() external onlyPlayer {
        if (gameStarted) revert Errors.GameAlreadyStarted();
        token.transferFrom(msg.sender, address(this), stakeAmount);
    }

    function startGame() external {
        if (playerCount < 2) revert Errors.NotEnoughPlayers();
        gameStarted = true;
    }

    function rollDice() external onlyPlayer returns (uint8) {
        if (!gameStarted) revert Errors.GameNotStarted();

        uint256 rand = uint256(
            keccak256(
                abi.encodePacked(block.timestamp, msg.sender, block.prevrandao)
            )
        );
        uint8 dice = uint8((rand % 6) + 1);
        players[msg.sender].score += dice;
        return dice;
    }

    function declareWinner() external {
        if (!gameStarted) revert Errors.GameNotStarted();

        address winner;
        uint256 highScore;
        for (uint8 i = 0; i < playerList.length; i++) {
            if (players[playerList[i]].score > highScore) {
                highScore = players[playerList[i]].score;
                winner = playerList[i];
            }
        }

        uint256 totalPot = stakeAmount * playerCount;
        token.transfer(winner, totalPot);

        gameStarted = false;
    }

    function getPlayers() external view returns (Player[] memory) {
        Player[] memory list = new Player[](playerCount);
        for (uint i = 0; i < playerList.length; i++) {
            list[i] = players[playerList[i]];
        }
        return list;
    }
}
