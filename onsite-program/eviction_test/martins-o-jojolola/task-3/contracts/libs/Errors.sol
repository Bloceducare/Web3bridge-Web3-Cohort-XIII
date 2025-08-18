// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.28;

library Errors {
    error MaxPlayersReached();
    error AlreadyRegistered();
    error ColorTaken();
    error NotRegistered();
    error GameAlreadyStarted();
    error NotEnoughPlayers();
    error GameNotStarted();
}
