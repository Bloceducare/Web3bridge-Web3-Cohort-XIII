// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

library LudoErrors {
    error InvalidStakeAmount();
    error GameDoesNotExist();
    error GameNotAcceptingPlayers();
    error GameIsFull();
    error ColorAlreadyTaken();
    error PlayerAlreadyInGame();
    error EmptyName();
    error GameNotAcceptingStakes();
    error PlayerNotRegistered();
    error PlayerAlreadyStaked();
    error TokenTransferFailed();
    error GameNotActive();
    error NotPlayerTurn();
    error InvalidDiceValue();
    error PrizeTransferFailed();
    error InvalidPlayerIndex();
    error InvalidAddress();
    error InsufficientBalance();
    error InsufficientAllowance();
}
