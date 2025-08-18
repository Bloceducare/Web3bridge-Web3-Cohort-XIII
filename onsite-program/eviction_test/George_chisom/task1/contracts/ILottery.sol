// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface ILottery {
    error InvalidEntryFee();
    error AlreadyEntered();
    error LotteryFull();
    error NotEnoughPlayers();
    error TransferFailed();
    
    event PlayerJoined(address indexed player, uint256 indexed lotteryId);
    event WinnerSelected(address indexed winner, uint256 prizeAmount, uint256 indexed lotteryId);
    event LotteryReset(uint256 indexed newLotteryId);
    
    function enterLottery() external payable;
    function getPlayers() external view returns (address[] memory);
    function getPlayerCount() external view returns (uint256);
    function getCurrentPrizePool() external view returns (uint256);
    function getLotteryInfo() external view returns (
        uint256 currentLotteryId,
        uint256 playerCount,
        uint256 prizePool,
        address[] memory currentPlayers
    );
}
