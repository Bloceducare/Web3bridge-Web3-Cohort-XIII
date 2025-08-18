// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

library ChronoStampErrors {
    error NotOwner();
    error InvalidAddress();
    error MaxSupplyReached();
    error NonexistentToken();
}