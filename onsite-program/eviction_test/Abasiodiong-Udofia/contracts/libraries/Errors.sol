// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

library Errors {
    error IncorrectFee(uint256 required, uint256 sent);
    error AlreadyEntered();
    error NotEnoughPlayers();
    error NoPlayers();
    error LotteryClosed();
    error RandomnessPending();
    error OnlyAdmin();
    error TransferFailed();
}