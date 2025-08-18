// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ILottery {
    event PlayerEntered(address indexed player, uint256 round);
    event WinnerSelected(address indexed winner, uint256 amount, uint256 round);
    event RoundStarted(uint256 round);
    
    function enter() external payable;
    function getCurrentRound() external view returns (uint256);
    function getPlayers() external view returns (address[] memory);
    function getEntryFee() external view returns (uint256);
    function getPrizePool() external view returns (uint256);
    function getLastWinner() external view returns (address);
}