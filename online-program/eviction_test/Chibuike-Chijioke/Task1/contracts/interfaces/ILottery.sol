// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

interface ILottery {
    function enterLottery() external payable;

    function getParticipants() external view returns (address[] memory);

    function getPrizePool() external view returns (uint256);

    function getCurrentRound() external view returns (uint256);
}
