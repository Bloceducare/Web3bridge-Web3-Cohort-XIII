// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface ILottery {
    event PlayerJoined(address indexed player);
    event WinnerSelected(address indexed winner, uint256 prize);

    function join() external payable;
    function getPlayers() external view returns (address[] memory);
    function getWinner() external view returns (address);
    function getPrizePool() external view returns (uint256);
    function getEntryFee() external view returns (uint256);
    function getPlayerCount() external view returns (uint256);
}