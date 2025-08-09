// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

library Errors {
    error InvalidAddress();
    error EventNotFound(uint256 eventId);
    error EventNotActive(uint256 eventId);
    error InsufficientPayment(uint256 required, uint256 sent);
    error NoTicketsAvailable(uint256 eventId);
    error NotEventCreator(uint256 eventId);
    error InvalidTicketPrice();
    error InvalidTicketCount();
    error NameCannotBeEmpty();
}
