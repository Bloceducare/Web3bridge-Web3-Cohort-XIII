// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./ILottery.sol";

contract Lottery is ILottery, ReentrancyGuard, Ownable {
    uint256 public constant ENTRY_FEE = 0.01 ether;
    uint256 public constant MAX_PLAYERS = 10;

    address[] public players;
    mapping(address => bool) public hasEntered;
    uint256 public lotteryId;
    address public lastWinner;
    uint256 public lastPrizeAmount;

    constructor() Ownable(msg.sender) {}

    modifier onlyValidEntry() {
        if (msg.value != ENTRY_FEE) revert InvalidEntryFee();
        if (hasEntered[msg.sender]) revert AlreadyEntered();
        if (players.length >= MAX_PLAYERS) revert LotteryFull();
        _;
    }
    
    function enterLottery() external payable onlyValidEntry nonReentrant {
        players.push(msg.sender);
        hasEntered[msg.sender] = true;

        emit PlayerJoined(msg.sender, lotteryId);

        if (players.length == MAX_PLAYERS) {
            selectWinner();
        }
    }
    
    function selectWinner() private {
        if (players.length != MAX_PLAYERS) revert NotEnoughPlayers();

        uint256 randomIndex = generateRandomNumber() % MAX_PLAYERS;
        address winner = players[randomIndex];
        uint256 prizeAmount = address(this).balance;

        lastWinner = winner;
        lastPrizeAmount = prizeAmount;

        emit WinnerSelected(winner, prizeAmount, lotteryId);

        (bool success, ) = winner.call{value: prizeAmount}("");
        if (!success) revert TransferFailed();

        resetLottery();
    }
    
    function resetLottery() private {
        uint256 playersLength = players.length;

        while (playersLength > 0) {
            playersLength--;
            hasEntered[players[playersLength]] = false;
        }

        delete players;
        lotteryId++;

        emit LotteryReset(lotteryId);
    }
    
    function generateRandomNumber() private view returns (uint256) {
        return uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            players.length,
            msg.sender
        )));
    }
    
    function getPlayers() external view returns (address[] memory) {
        return players;
    }
    
    function getPlayerCount() external view returns (uint256) {
        return players.length;
    }
    
    function getCurrentPrizePool() external view returns (uint256) {
        return address(this).balance;
    }
    
    function getLotteryInfo() external view returns (
        uint256 currentLotteryId,
        uint256 playerCount,
        uint256 prizePool,
        address[] memory currentPlayers
    ) {
        return (lotteryId, players.length, address(this).balance, players);
    }
}
